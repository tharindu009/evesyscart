import imagekit from "@/configs/imageKit";
import prisma from "@/lib/prisma";
import { getAuth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// create the store
export async function POST(request) {
    try {
        const { userId } = getAuth(request)
        if (!userId) {
            console.error("Store Create Error: User not authenticated");
            return NextResponse.json({ error: "User not authenticated" }, { status: 401 })
        }

        // Get the data from the form
        const formData = await request.formData()

        const name = formData.get("name")
        const usernameRaw = formData.get("username")
        const description = formData.get("description")
        const email = formData.get("email")
        const contact = formData.get("contact")
        const address = formData.get("address")
        const image = formData.get("image")

        if (!name || !usernameRaw || !description || !email || !contact || !address || !image) {
            console.error("Store Create Error: Missing fields", { name, usernameRaw, description, email, contact, address, hasImage: !!image });
            return NextResponse.json({ error: "missing store info" }, { status: 400 })
        }

        const username = usernameRaw.trim()

        // check is user have already registered a store
        const store = await prisma.store.findFirst({
            where: { userId: userId }
        })

        // if store is already registered then send status of store
        if (store) {
            return NextResponse.json({ status: store.status })
        }

        // check is username is already taken
        const isUsernameTaken = await prisma.store.findFirst({
            where: { username: username.toLowerCase() }
        })

        if (isUsernameTaken) {
            return NextResponse.json({ error: "username already taken" }, { status: 400 })
        }

        // image upload to imagekit
        const buffer = Buffer.from(await image.arrayBuffer());
        const response = await imagekit.upload({
            file: buffer,
            fileName: image.name,
            folder: "logos"
        })

        const optimizedImage = imagekit.url({
            path: response.filePath,
            transformation: [
                { quality: 'auto' },
                { format: 'webp' },
                { width: '512' }
            ]
        })

        const newStore = await prisma.store.create({
            data: {
                userId,
                name,
                description,
                username: username.toLowerCase(),
                email,
                contact,
                address,
                logo: optimizedImage
            }
        })

        //  link store to user
        // user might not exist if webhook failed, so check first or wrap in try/catch for updating user
        try {
            await prisma.user.update({
                where: { id: userId },
                data: { store: { connect: { id: newStore.id } } }
            })
        } catch (userError) {
            console.error("Store Create Error: Failed to link store to user", userError);
            // Verify if user exists
            const userExists = await prisma.user.findUnique({ where: { id: userId } });
            if (!userExists) {
                // Creating user record as fallback (this should ideally be handled by webhook)
                // However, we don't have user details (name, email, image) here readily available from getAuth alone without extra call
                console.error("User record not found in database for ID:", userId);
                return NextResponse.json({ error: "User record not found. Please try logging out and in again." }, { status: 500 })
            }
            throw userError; // Re-throw if it's another error
        }

        return NextResponse.json({ message: "applied, waiting for approval" })

    } catch (error) {
        console.error("Store Create Error:", error);
        return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 400 })
    }
}

// check is user have already registered a store if yes then send status of store

export async function GET(request) {
    try {
        const { userId } = getAuth(request)

        // check is user have already registered a store
        const store = await prisma.store.findFirst({
            where: { userId: userId }
        })

        // if store is already registered then send status of store
        if (store) {
            return NextResponse.json({ status: store.status })
        }

        return NextResponse.json({ status: "not registered" })
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: error.code || error.message }, { status: 400 })
    }
}