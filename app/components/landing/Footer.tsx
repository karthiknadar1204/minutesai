import { Bot } from 'lucide-react'
import React from 'react'

function Footer() {
    return (
        <footer className='border-t border-gray-800 py-5 bg-black'>
            <div className='max-w-6xl mx-auto px-4'>
                <div className='flex flex-col md:flex-row justify-between items-center'>
                    <div className='flex items-center space-x-2 mb-4 md:mb-0'>
                        <span className='text-xl font-bold text-white'>Kaira</span>
                    </div>
                    <div className='text-gray-500 text-sm'>
                        &copy; {new Date().getFullYear()} MeetingBot. Made with ❤️ for better meetings.
                    </div>
                </div>
            </div>
        </footer>
    )
}

export default Footer