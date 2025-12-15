export default function Home() {
  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-neutral-50 to-neutral-100 dark:from-neutral-900 dark:to-neutral-800">
      <div className="flex min-h-screen flex-col items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
        <main className="w-full max-w-2xl space-y-8">
          {/* Header */}
          <div className="space-y-4 text-center">
            <div className="inline-flex items-center justify-center rounded-full bg-primary-100 dark:bg-primary-900 px-4 py-2 text-sm font-medium text-primary-700 dark:text-primary-200">
              Welcome to YouTube App
            </div>
            <h1 className="text-4xl font-bold tracking-tight text-neutral-900 dark:text-white sm:text-5xl">
              Modern YouTube Experience
            </h1>
            <p className="text-lg text-neutral-600 dark:text-neutral-400">
              Built with Next.js 13, TypeScript, Tailwind CSS, and ESLint
            </p>
          </div>

          {/* Desktop Surface - Features Grid */}
          <div className="rounded-2xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 shadow-lg overflow-hidden">
            <div className="grid grid-cols-1 divide-y divide-neutral-200 dark:divide-neutral-700 sm:grid-cols-2 sm:divide-y-0 sm:divide-x">
              {/* Feature 1 */}
              <div className="flex flex-col items-start justify-between p-8 hover:bg-neutral-50 dark:hover:bg-neutral-700/50 transition-colors">
                <div className="space-y-2 mb-4">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-primary-100 dark:bg-primary-900 text-primary-600 dark:text-primary-400">
                    <svg
                      className="w-6 h-6"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-neutral-900 dark:text-white">
                    Type-Safe Development
                  </h3>
                </div>
                <p className="text-sm text-neutral-600 dark:text-neutral-400">
                  Full TypeScript support for enhanced developer experience and fewer runtime errors
                </p>
              </div>

              {/* Feature 2 */}
              <div className="flex flex-col items-start justify-between p-8 hover:bg-neutral-50 dark:hover:bg-neutral-700/50 transition-colors">
                <div className="space-y-2 mb-4">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-success-50 dark:bg-success-900/20 text-success-600 dark:text-success-400">
                    <svg
                      className="w-6 h-6"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 10V3L4 14h7v7l9-11h-7z"
                      />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-neutral-900 dark:text-white">
                    Fast Performance
                  </h3>
                </div>
                <p className="text-sm text-neutral-600 dark:text-neutral-400">
                  Built on the modern App Router for optimal performance and developer experience
                </p>
              </div>

              {/* Feature 3 */}
              <div className="flex flex-col items-start justify-between p-8 hover:bg-neutral-50 dark:hover:bg-neutral-700/50 transition-colors">
                <div className="space-y-2 mb-4">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-warning-50 dark:bg-warning-900/20 text-warning-600 dark:text-warning-400">
                    <svg
                      className="w-6 h-6"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"
                      />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-neutral-900 dark:text-white">
                    Styled with Tailwind
                  </h3>
                </div>
                <p className="text-sm text-neutral-600 dark:text-neutral-400">
                  Utility-first CSS framework with comprehensive theming and dark mode support
                </p>
              </div>

              {/* Feature 4 */}
              <div className="flex flex-col items-start justify-between p-8 hover:bg-neutral-50 dark:hover:bg-neutral-700/50 transition-colors">
                <div className="space-y-2 mb-4">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-error-50 dark:bg-error-900/20 text-error-600 dark:text-error-400">
                    <svg
                      className="w-6 h-6"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8v4m0 4v.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-neutral-900 dark:text-white">
                    Code Quality
                  </h3>
                </div>
                <p className="text-sm text-neutral-600 dark:text-neutral-400">
                  Integrated ESLint configuration for consistent code quality and best practices
                </p>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-4">
            <div className="rounded-lg bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 p-4 text-center">
              <div className="text-2xl font-bold text-primary-600 dark:text-primary-400">
                13
              </div>
              <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-1">
                Next.js Version
              </p>
            </div>
            <div className="rounded-lg bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 p-4 text-center">
              <div className="text-2xl font-bold text-primary-600 dark:text-primary-400">
                5
              </div>
              <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-1">
                Folder Structure
              </p>
            </div>
            <div className="rounded-lg bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 p-4 text-center">
              <div className="text-2xl font-bold text-primary-600 dark:text-primary-400">
                ✓
              </div>
              <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-1">
                Ready to Build
              </p>
            </div>
          </div>

          {/* Footer Info */}
          <div className="rounded-lg bg-neutral-100 dark:bg-neutral-700/50 border border-neutral-200 dark:border-neutral-600 p-6">
            <h3 className="font-semibold text-neutral-900 dark:text-white mb-2">
              Getting Started
            </h3>
            <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-4">
              This is a Next.js 13 application built with:
            </p>
            <ul className="space-y-2">
              <li className="flex items-center text-sm text-neutral-600 dark:text-neutral-400">
                <span className="mr-2 text-primary-500">✓</span>
                Next.js 13 with App Router
              </li>
              <li className="flex items-center text-sm text-neutral-600 dark:text-neutral-400">
                <span className="mr-2 text-primary-500">✓</span>
                TypeScript for type safety
              </li>
              <li className="flex items-center text-sm text-neutral-600 dark:text-neutral-400">
                <span className="mr-2 text-primary-500">✓</span>
                Tailwind CSS for styling
              </li>
              <li className="flex items-center text-sm text-neutral-600 dark:text-neutral-400">
                <span className="mr-2 text-primary-500">✓</span>
                ESLint for code quality
              </li>
              <li className="flex items-center text-sm text-neutral-600 dark:text-neutral-400">
                <span className="mr-2 text-primary-500">✓</span>
                Light/Dark mode support
              </li>
            </ul>
          </div>
        </main>
      </div>
    </div>
  );
}
