import { defineConfig } from 'vitepress'

export default defineConfig({
    title: 'Express Apollo Server',
    description: 'Complete Node.js backend with Express REST API and Apollo GraphQL with real-time subscriptions',

    themeConfig: {
        logo: '/logo.svg',

        nav: [
            { text: 'Home', link: '/' },
            { text: 'API', link: '/api/' },
            { text: 'Guides', link: '/guides/' },
            { text: 'Architecture', link: '/architecture/' }
        ],

        sidebar: {
            '/api/': [
                {
                    text: 'API Reference',
                    items: [
                        { text: 'Overview', link: '/api/' },
                        {
                            text: 'GraphQL API',
                            collapsed: false,
                            items: [
                                { text: 'Schema Overview', link: '/api/graphql/schema' },
                                { text: 'Queries', link: '/api/graphql/queries' },
                                { text: 'Mutations', link: '/api/graphql/mutations' },
                                { text: 'Subscriptions', link: '/api/graphql/subscriptions' }
                            ]
                        },
                        {
                            text: 'REST API',
                            collapsed: false,
                            items: [
                                { text: 'Authentication', link: '/api/rest/authentication' },
                                { text: 'Users', link: '/api/rest/users' },
                                { text: 'Analytics', link: '/api/rest/analytics' }
                            ]
                        }
                    ]
                }
            ],

            '/guides/': [
                {
                    text: 'Guides',
                    items: [
                        { text: 'Getting Started', link: '/guides/' },
                        { text: 'Authentication', link: '/guides/authentication' },
                        { text: 'Real-time Subscriptions', link: '/guides/subscriptions' },
                        { text: 'Testing', link: '/guides/testing' },
                        { text: 'Deployment', link: '/guides/deployment' },
                        { text: 'Environment Setup', link: '/guides/environment' }
                    ]
                }
            ],

            '/architecture/': [
                {
                    text: 'Architecture',
                    items: [
                        { text: 'Overview', link: '/architecture/' },
                        { text: 'Domain-based Structure', link: '/architecture/domain-structure' },
                        { text: 'Database Schema', link: '/architecture/database' },
                        { text: 'Security', link: '/architecture/security' },
                        { text: 'Performance', link: '/architecture/performance' }
                    ]
                }
            ]
        },

        socialLinks: [
            { icon: 'github', link: 'https://github.com/Neumao/express-apollo-server' }
        ],

        search: {
            provider: 'local'
        },

        editLink: {
            pattern: 'https://github.com/Neumao/express-apollo-server/edit/main/docs/:path'
        }
    },

    markdown: {
        theme: {
            light: 'github-light',
            dark: 'github-dark'
        },
        lineNumbers: true
    }
})