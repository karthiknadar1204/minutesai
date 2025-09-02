import React from 'react'

function HowItWorksSection() {
    return (
        <section className='py-24 bg-gradient-to-b from-black via-gray-900/20 to-black relative overflow-hidden'>
            {/* Background decorative elements */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(52,152,219,0.1),transparent_50%)]"></div>
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(52,152,219,0.08),transparent_50%)]"></div>
            
            <div className='max-w-7xl mx-auto px-4 relative z-10'>
                <div className='text-center mb-20'>
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#3498db]/10 border border-[#3498db]/20 mb-6">
                        <div className="w-2 h-2 bg-[#3498db] rounded-full animate-pulse"></div>
                        <span className="text-sm font-medium text-[#3498db]">Simple 3-Step Process</span>
                    </div>
                    <h2 className='text-4xl md:text-5xl font-bold text-white mb-6 leading-tight'>
                        How It{' '}
                        <span className="bg-gradient-to-r from-[#3498db] via-[#2980b9] to-[#1f5f8b] bg-clip-text text-transparent">
                            Works
                        </span>
                    </h2>
                    <p className="text-xl max-w-3xl mx-auto bg-gradient-to-r from-gray-300 to-gray-500 bg-clip-text text-transparent drop-shadow-[0_0_15px_rgba(156,163,175,0.3)] leading-relaxed">
                        Get started in minutes with our streamlined process designed for seamless integration
                    </p>
                </div>
                
                <div className='grid md:grid-cols-3 gap-8 relative'>
                    {/* Connection lines */}
                    <div className="hidden md:block absolute top-1/2 left-1/3 right-1/3 h-px bg-gradient-to-r from-transparent via-[#3498db]/30 to-transparent transform -translate-y-1/2"></div>
                    <div className="hidden md:block absolute top-1/2 left-2/3 right-1/3 h-px bg-gradient-to-r from-transparent via-[#3498db]/30 to-transparent transform -translate-y-1/2"></div>
                    
                    <div className='text-center group relative'>
                        <div className='relative mb-8'>
                            <div className='w-24 h-24 mx-auto rounded-2xl bg-gradient-to-br from-[#3498db] to-[#2980b9] p-0.5 shadow-2xl shadow-[#3498db]/25'>
                                <div className='w-full h-full bg-black rounded-2xl flex items-center justify-center'>
                                    <span className='text-3xl font-bold text-white'>1</span>
                                </div>
                            </div>
                            <div className='absolute -top-2 -right-2 w-8 h-8 bg-[#3498db] rounded-full flex items-center justify-center shadow-lg'>
                                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                        </div>
                        <h3 className='text-2xl font-bold text-white mb-4 group-hover:text-[#3498db] transition-colors duration-300'>
                            Connect Calendar
                        </h3>
                        <p className='text-gray-400 text-lg leading-relaxed max-w-sm mx-auto'>
                            Link your Google Calendar and we'll automatically detect your meetings with intelligent scheduling
                        </p>
                        <div className='mt-6 opacity-0 group-hover:opacity-100 transition-opacity duration-300'>
                            <div className='inline-flex items-center gap-2 text-[#3498db] text-sm font-medium'>
                                <span>Seamless Integration</span>
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                            </div>
                        </div>
                    </div>
                    
                    <div className='text-center group relative'>
                        <div className='relative mb-8'>
                            <div className='w-24 h-24 mx-auto rounded-2xl bg-gradient-to-br from-[#3498db] to-[#2980b9] p-0.5 shadow-2xl shadow-[#3498db]/25'>
                                <div className='w-full h-full bg-black rounded-2xl flex items-center justify-center'>
                                    <span className='text-3xl font-bold text-white'>2</span>
                                </div>
                            </div>
                            <div className='absolute -top-2 -right-2 w-8 h-8 bg-[#3498db] rounded-full flex items-center justify-center shadow-lg'>
                                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                        </div>
                        <h3 className='text-2xl font-bold text-white mb-4 group-hover:text-[#3498db] transition-colors duration-300'>
                            AI Bot Joins
                        </h3>
                        <p className='text-gray-400 text-lg leading-relaxed max-w-sm mx-auto'>
                            Our intelligent AI bot automatically joins and records your meetings with full transcription
                        </p>
                        <div className='mt-6 opacity-0 group-hover:opacity-100 transition-opacity duration-300'>
                            <div className='inline-flex items-center gap-2 text-[#3498db] text-sm font-medium'>
                                <span>Smart Recording</span>
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                            </div>
                        </div>
                    </div>
                    
                    <div className='text-center group relative'>
                        <div className='relative mb-8'>
                            <div className='w-24 h-24 mx-auto rounded-2xl bg-gradient-to-br from-[#3498db] to-[#2980b9] p-0.5 shadow-2xl shadow-[#3498db]/25'>
                                <div className='w-full h-full bg-black rounded-2xl flex items-center justify-center'>
                                    <span className='text-3xl font-bold text-white'>3</span>
                                </div>
                            </div>
                            <div className='absolute -top-2 -right-2 w-8 h-8 bg-[#3498db] rounded-full flex items-center justify-center shadow-lg'>
                                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                        </div>
                        <h3 className='text-2xl font-bold text-white mb-4 group-hover:text-[#3498db] transition-colors duration-300'>
                            Get Insights
                        </h3>
                        <p className='text-gray-400 text-lg leading-relaxed max-w-sm mx-auto'>
                            Receive comprehensive summaries, action items, and push them to your favorite tools instantly
                        </p>
                        <div className='mt-6 opacity-0 group-hover:opacity-100 transition-opacity duration-300'>
                            <div className='inline-flex items-center gap-2 text-[#3498db] text-sm font-medium'>
                                <span>Instant Results</span>
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                            </div>
                        </div>
                    </div>
                </div>
                
                {/* Bottom CTA */}
                <div className='text-center mt-16'>
                    <div className='inline-flex items-center gap-3 px-6 py-3 rounded-full bg-[#3498db]/10 border border-[#3498db]/20 hover:bg-[#3498db]/20 transition-all duration-300 cursor-pointer group'>
                        <span className='text-[#3498db] font-medium'>Ready to get started?</span>
                        <svg className="w-4 h-4 text-[#3498db] group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                    </div>
                </div>
            </div>
        </section>
    )
}

export default HowItWorksSection