import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export function Landing() {
  const { user, signOut } = useAuth()

  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 text-gray-900 font-semibold">
            <span className="w-8 h-8 rounded bg-primary-600 flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </span>
            QUOTATION JOBMAAMAA
          </div>
          {user ? (
            <button
              onClick={() => signOut()}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary-600 text-white text-sm font-medium hover:bg-primary-700"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Logout
            </button>
          ) : null}
        </div>
      </header>

      <section className="max-w-3xl mx-auto px-4 py-12 text-center">
        <div className="flex justify-center mb-8">
          <div className="w-full max-w-[280px] rounded-2xl overflow-hidden shadow-xl bg-black border-4 border-gray-200">
            <div className="aspect-[9/16] bg-gray-900 flex items-center justify-center overflow-hidden">
              <img
                src="/welcome-photo.png"
                alt="Welcome"
                className="w-full h-full object-cover object-top"
              />
            </div>
          </div>
        </div>
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-50 text-primary-700 text-sm font-medium mb-6">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          PROFESSIONAL TOOL
        </div>
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
          WELCOME FOR CREATING <span className="text-primary-600">Quotation</span>
        </h1>
        <p className="text-gray-600 mb-8 max-w-lg mx-auto">
          Simplifying your quotation process with ease and efficiency. Professional designs, instant calculations, and seamless sharing.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
          <Link
            to="/dashboard"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-primary-600 text-white font-semibold hover:bg-primary-700 shadow-lg shadow-primary-200 transition"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            GET STARTED
          </Link>
          <Link
            to="/register"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl border-2 border-gray-200 text-gray-800 font-semibold hover:border-primary-300 hover:bg-primary-50 transition"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            GO TO REGISTER
          </Link>
        </div>
        <p className="text-gray-500 text-sm">
          Already registered?{' '}
          <Link to="/login" className="text-primary-600 font-semibold hover:underline">
            SIGN IN →
          </Link>
        </p>

        <div className="mt-16 pt-10 border-t border-gray-200">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">OUR LANGUAGE SUPPORT</h3>
          <div className="flex flex-wrap justify-center gap-3">
            {['English', 'Bengali', 'Arabic'].map((lang) => (
              <button
                key={lang}
                className="px-5 py-2.5 rounded-full border border-gray-200 text-gray-700 text-sm font-medium hover:border-primary-300 hover:bg-primary-50 transition"
              >
                {lang}
              </button>
            ))}
          </div>
        </div>
      </section>

      <footer className="border-t border-gray-200 py-6 mt-12">
        <div className="max-w-6xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-gray-600 text-sm font-medium">
            <span className="w-6 h-6 rounded bg-primary-100 flex items-center justify-center">
              <svg className="w-3 h-3 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </span>
            QUOTATION JOBMAAMAA
          </div>
          <p className="text-gray-500 text-sm">© QUOTATION JOBMAAMAA-2026 (2576679498) ALL RIGHTS RESERVED</p>
          <div className="flex gap-4">
            <a href="#" className="text-gray-400 hover:text-primary-600" aria-label="Help">?</a>
            <a href="#" className="text-gray-400 hover:text-primary-600" aria-label="Privacy">🛡</a>
            <a href="#" className="text-gray-400 hover:text-primary-600" aria-label="Email">✉</a>
          </div>
        </div>
      </footer>
    </div>
  )
}
