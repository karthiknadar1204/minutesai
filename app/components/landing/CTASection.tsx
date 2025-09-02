'use client'

import { Button } from '@/components/ui/button'
import { SignUpButton, useUser } from '@clerk/nextjs'
import { ArrowRight, Star } from 'lucide-react'
import Link from 'next/link'
import React from 'react'

function CTASection() {
    const { isSignedIn } = useUser()
    return (
        <section className='py-20 bg-black'>
            <div className='max-w-4xl mx-auto px-4 text-center'>
                <h2 className='text-3xl md:text-4xl font-bold text-white mb-4'>
                    Ready to{' '}
                    <span className="bg-gradient-to-r from-[#3498db] via-[#2980b9] to-[#1f5f8b] bg-clip-text text-transparent">
                        revolutionize your meetings?
                    </span>
                </h2>
                <p className="text-lg bg-gradient-to-r from-gray-300 to-gray-500 bg-clip-text text-transparent drop-shadow-[0_0_15px_rgba(156,163,175,0.3)] mb-8">
                    Join thousands of teams aldready using MeetingBot to save time.
                </p>
                {isSignedIn ? (
                    <Button asChild size="lg" className='bg-[#3498db] hover:bg-[#2980b9] px-8 py-4'>
                        <Link href="/home" className='group'>
                            <span>Dashboard</span>
                            <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                        </Link>
                    </Button>
                ) : (
                    <SignUpButton>
                        <Button size="lg" className="bg-[#3498db] hover:bg-[#2980b9] px-8 py-4 group">
                            <span>Start Your Free Trail</span>
                            <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                        </Button>
                    </SignUpButton>
                )}

            </div>
        </section>
    )
}

export default CTASection