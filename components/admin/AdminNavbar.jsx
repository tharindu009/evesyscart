'use client'
import { useUser, UserButton } from "@clerk/nextjs"
import Image from "next/image"
import Link from "next/link"
import logo from "@/assets/logo.jpeg"

const AdminNavbar = () => {

    const { user } = useUser()

    return (
        <div className="flex items-center justify-between px-12 py-3 border-b border-slate-200 transition-all">
            <Link href="/admin" className="relative">
                <Image src={logo} alt="GoCart Logo" width={160} height={40} className="object-contain" />
                <p className="absolute text-xs font-semibold -top-1 -right-13 px-3 p-0.5 rounded-full flex items-center gap-2 text-white bg-green-500">
                    Admin
                </p>
            </Link>
            <div className="flex items-center gap-3">
                <p>Hi, {user?.firstName}</p>
                <UserButton />
            </div>
        </div>
    )
}

export default AdminNavbar