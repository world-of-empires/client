import Link from 'next/link'

export default function Home() {
    return (
        <div className='flex min-h-screen w-full items-center justify-center'>
            <div className='flex flex-col items-center gap-4'>
                <h1 className='text-3xl font-bold underline'>Welcome to World of Empires!</h1>

                <Link
                    href='/game'
                    className='ml-4 max-w-fit rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600'
                >
                    Start Game
                </Link>
            </div>
        </div>
    )
}
