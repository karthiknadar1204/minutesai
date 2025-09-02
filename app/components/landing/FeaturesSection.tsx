import { Bot, Calendar, Mail, MessageSquare, Share2, Slack } from 'lucide-react'
import React from 'react'

const features = [
    {
        icon: Bot,
        title: "AI Meeting Summaries",
        description: "Automatic meeting summaries and action items after each meeting",
        color: "text-[#3498db]",
        bgColor: "bg-[#3498db]/10",
    },
    {
        icon: Calendar,
        title: "Smart Calendar Integration",
        description: "Connect Google Calendar and bots automatically join meetings",
        color: "text-emerald-400",
        bgColor: "bg-emerald-500/10",
    },
    {
        icon: Mail,
        title: "Automated Email Reports",
        description: "Receive beautiful email summaries with action items",
        color: "text-amber-400",
        bgColor: "bg-amber-500/10",
    },
    {
        icon: MessageSquare,
        title: "Chat with Meetings",
        description: "Ask questions about meetings using our RAG pipeline",
        color: "text-violet-400",
        bgColor: "bg-violet-500/10",
    },
    {
        icon: Share2,
        title: "One-Click Integrations",
        description: "Push action items to Slack and Jira seamlessly",
        color: "text-teal-400",
        bgColor: "bg-teal-500/10",
    },
    {
        icon: Slack,
        title: "Slack bot Integration",
        description: "Install our Slack Bot to ask questions and share insights",
        color: "text-rose-400",
        bgColor: "bg-rose-500/10",
    },
]

function FeaturesSection() {
    return (
        <section className='py-20 bg-black'>
            <div className='max-w-6xl mx-auto px-4'>
                <div className='text-center mb-16'>
                    <h2 className='text-3xl md:text-4xl font-bold text-white mb-4'>
                        Everything you need for{' '}
                        <span className="bg-gradient-to-r from-[#3498db] via-[#2980b9] to-[#1f5f8b] bg-clip-text text-transparent">
                            Smarter Meetings
                        </span>
                    </h2>
                    <p className="text-lg max-w-2xl mx-auto bg-gradient-to-r from-gray-300 to-gray-500 bg-clip-text text-transparent drop-shadow-[0_0_15px_rgba(156,163,175,0.3)]">
                        From AI summaries to seamless integrations, we've got every aspect covered.
                    </p>

                </div>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {features.map((feature, index) => (
                        <div
                            key={index}
                            className='bg-gray-900/50 border border-gray-800 rounded-xl p-6 hover:bg-gray-900/70 hover:border-gray-700 transition-all'
                        >
                            <div className={`w-12 h-12 ${feature.bgColor} rounded-lg flex items-center justify-center mb-4`}>
                                <feature.icon className={`w-6 h-6 ${feature.color}`} />
                            </div>
                            <h3 className='text-xl font-semibold text-white mb-2'>
                                {feature.title}
                            </h3>
                            <p className='text-gray-400'>
                                {feature.description}
                            </p>

                        </div>
                    ))}
                </div>

            </div>
        </section>
    )
}

export default FeaturesSection