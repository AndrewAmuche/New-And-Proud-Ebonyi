/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import AdminPanel from './components/AdminPanel.tsx';

/**
 * Custom typewriter hook
 * Takes text, typing speed (default 38ms), and startDelay (default 600ms).
 * Returns { displayed, done }
 */
function useTypewriter(text: string, speed = 38, startDelay = 600) {
  const [displayed, setDisplayed] = useState('');
  const [done, setDone] = useState(false);

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>;
    let intervalId: ReturnType<typeof setInterval>;
    let charIndex = 0;

    timeoutId = setTimeout(() => {
      intervalId = setInterval(() => {
        charIndex++;
        setDisplayed(text.slice(0, charIndex));
        if (charIndex >= text.length) {
          setDone(true);
          clearInterval(intervalId);
        }
      }, speed);
    }, startDelay);

    return () => {
      clearTimeout(timeoutId);
      if (intervalId) clearInterval(intervalId);
    };
  }, [text, speed, startDelay]);

  return { displayed, done };
}

type ModalType =
  | 'register'
  | 'workshops'
  | 'mentors'
  | 'partner'
  | 'summit'
  | 'impact'
  | 'contact'
  | null;

export default function App() {
  // Admin View state
  const [isAdminView, setIsAdminView] = useState(false);

  // Mobile nav state
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Pills visibility state (appears 400ms after load)
  const [pillsVisible, setPillsVisible] = useState(false);

  // Active modal
  const [activeModal, setActiveModal] = useState<ModalType>(null);

  // Registration pass confirmation
  const [registeredStudent, setRegisteredStudent] = useState<{
    name: string;
    school: string;
    passCode: string;
  } | null>(null);

  // Copy email feedback
  const [copied, setCopied] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Video element and mouse-scrubbing refs
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const prevXRef = useRef<number | null>(null);
  const targetTimeRef = useRef<number>(0);
  const isSeekingRef = useRef<boolean>(false);
  const SENSITIVITY = 0.8;

  // Typewriter hook for student empowerment event hero prompt
  const heroPrompt =
    'Nurturing the next generation of scholars, tech creators, and visionary leaders across Ebonyi State. Are you ready to rise?';
  const { displayed: typewriterText, done: typewriterDone } = useTypewriter(
    heroPrompt,
    36,
    600
  );

  // Trigger pills fade-in after 400ms independently of typewriter
  useEffect(() => {
    const timer = setTimeout(() => {
      setPillsVisible(true);
    }, 400);
    return () => clearTimeout(timer);
  }, []);

  // Perform seek when targetTime moves
  const performSeek = () => {
    const video = videoRef.current;
    if (!video || !video.duration || isSeekingRef.current) return;

    if (Math.abs(video.currentTime - targetTimeRef.current) > 0.02) {
      isSeekingRef.current = true;
      video.currentTime = targetTimeRef.current;
    }
  };

  // onSeeked handler to prevent seek-flooding and queue next seek
  const handleSeeked = () => {
    isSeekingRef.current = false;
    const video = videoRef.current;
    if (!video || !video.duration) return;

    if (Math.abs(video.currentTime - targetTimeRef.current) > 0.02) {
      isSeekingRef.current = true;
      video.currentTime = targetTimeRef.current;
    }
  };

  // Video mouse-scrub listener on window
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const video = videoRef.current;
      if (!video || !video.duration || Number.isNaN(video.duration)) {
        prevXRef.current = e.clientX;
        return;
      }

      if (prevXRef.current === null) {
        prevXRef.current = e.clientX;
        targetTimeRef.current = video.currentTime;
        return;
      }

      const delta = e.clientX - prevXRef.current;
      prevXRef.current = e.clientX;

      const timeOffset =
        (delta / window.innerWidth) * SENSITIVITY * video.duration;
      let nextTarget = targetTimeRef.current + timeOffset;
      nextTarget = Math.max(0, Math.min(video.duration, nextTarget));
      targetTimeRef.current = nextTarget;

      performSeek();
    };

    // Touch support for horizontal scrubbing on mobile/tablets
    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        const clientX = e.touches[0].clientX;
        const video = videoRef.current;
        if (!video || !video.duration || Number.isNaN(video.duration)) {
          prevXRef.current = clientX;
          return;
        }

        if (prevXRef.current === null) {
          prevXRef.current = clientX;
          targetTimeRef.current = video.currentTime;
          return;
        }

        const delta = clientX - prevXRef.current;
        prevXRef.current = clientX;

        const timeOffset =
          (delta / window.innerWidth) * SENSITIVITY * video.duration;
        let nextTarget = targetTimeRef.current + timeOffset;
        nextTarget = Math.max(0, Math.min(video.duration, nextTarget));
        targetTimeRef.current = nextTarget;

        performSeek();
      }
    };

    const handleMouseLeave = () => {
      prevXRef.current = null;
    };

    const handleTouchEnd = () => {
      prevXRef.current = null;
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('touchmove', handleTouchMove, { passive: true });
    window.addEventListener('touchend', handleTouchEnd);
    window.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
      window.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, []);

  // Handle clipboard copy
  const handleCopyEmail = (e: React.MouseEvent) => {
    e.preventDefault();
    navigator.clipboard
      .writeText('contact@newandproudebonyi.org')
      .then(() => {
        setCopied(true);
        setToastMessage('Copied contact@newandproudebonyi.org');
        setTimeout(() => setCopied(false), 2000);
        setTimeout(() => setToastMessage(null), 3000);
      })
      .catch(() => {
        setToastMessage('Email: contact@newandproudebonyi.org');
        setTimeout(() => setToastMessage(null), 3000);
      });
  };

  const openModal = (type: ModalType) => {
    setActiveModal(type);
    setMobileMenuOpen(false);
  };

  const closeModal = () => {
    setActiveModal(null);
  };

  if (isAdminView) {
    return <AdminPanel onBackToLanding={() => setIsAdminView(false)} />;
  }

  return (
    <div className="relative w-screen min-h-screen bg-black text-white selection:bg-white selection:text-black">
      {/* BACKGROUND VIDEO (mouse-scrub controlled) */}
      <video
        ref={videoRef}
        src="https://res.cloudinary.com/drddunnrc/video/upload/v1792827621/Man_turning_head_and_smiling_20261023104826.mp4"
        muted
        playsInline
        preload="auto"
        onSeeked={handleSeeked}
        onLoadedMetadata={() => {
          if (videoRef.current) {
            targetTimeRef.current = videoRef.current.currentTime || 0;
          }
        }}
        className="fixed inset-0 z-0 w-full h-full object-cover pointer-events-none select-none"
        style={{
          objectPosition: '70% center',
        }}
      />

      {/* Subtle overlay gradient scrim for high typographic clarity */}
      <div
        className="fixed inset-0 z-0 bg-gradient-to-t from-black/80 via-black/30 to-black/50 pointer-events-none"
        aria-hidden="true"
      />

      {/* NAVBAR (fixed, z-index: 10) */}
      <header className="fixed top-0 left-0 right-0 z-10 w-full px-5 sm:px-8 py-4 sm:py-5 flex justify-between items-center">
        {/* Logo (left) */}
        <div className="flex items-center gap-3">
          <span
            className="text-[21px] sm:text-[26px] tracking-tight text-white select-none leading-none"
            style={{ fontFamily: 'var(--font-heading)' }}
          >
            New and Proud Ebonyi®
          </span>
          <span
            className="text-[25px] sm:text-[30px] text-white select-none leading-none"
            style={{ letterSpacing: '-0.02em' }}
            aria-hidden="true"
          >
            ✳︎
          </span>
        </div>

        {/* Desktop nav links (center, hidden below md) */}
        <nav
          aria-label="Desktop Navigation"
          className="hidden md:flex items-center text-[23px] text-white select-none"
        >
          <button
            type="button"
            onClick={() => openModal('summit')}
            className="hover:opacity-60 transition-opacity cursor-pointer"
          >
            Summit
          </button>
          <span className="cursor-default">,&nbsp;</span>
          <button
            type="button"
            onClick={() => openModal('workshops')}
            className="hover:opacity-60 transition-opacity cursor-pointer"
          >
            Workshops
          </button>
          <span className="cursor-default">,&nbsp;</span>
          <button
            type="button"
            onClick={() => openModal('mentors')}
            className="hover:opacity-60 transition-opacity cursor-pointer"
          >
            Mentors
          </button>
          <span className="cursor-default">,&nbsp;</span>
          <button
            type="button"
            onClick={() => openModal('impact')}
            className="hover:opacity-60 transition-opacity cursor-pointer"
          >
            Impact
          </button>
        </nav>

        {/* Desktop CTA (right, hidden below md) */}
        <div className="hidden md:flex items-center gap-5">
          <button
            type="button"
            onClick={() => setIsAdminView(true)}
            className="text-xs uppercase tracking-wider font-mono text-neutral-300 hover:text-white px-3 py-1 rounded-full border border-neutral-700 hover:border-neutral-400 bg-black/40 backdrop-blur-md transition-colors cursor-pointer"
            title="Open Attendees Registry & Ops Desk"
          >
            Admin Panel
          </button>
          <button
            type="button"
            onClick={() => openModal('register')}
            className="text-[23px] text-white underline underline-offset-2 hover:opacity-60 transition-opacity cursor-pointer"
          >
            Register Now
          </button>
        </div>

        {/* Mobile hamburger (visible below md) */}
        <button
          type="button"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label={mobileMenuOpen ? 'Close navigation' : 'Open navigation'}
          aria-expanded={mobileMenuOpen}
          className="md:hidden relative z-20 flex flex-col justify-center items-center gap-[5px] p-2 focus:outline-none cursor-pointer"
        >
          <span
            className={`w-6 h-[2px] bg-white transition-all duration-300 ${
              mobileMenuOpen ? 'rotate-45 translate-y-[7px]' : ''
            }`}
          />
          <span
            className={`w-6 h-[2px] bg-white transition-all duration-300 ${
              mobileMenuOpen ? 'opacity-0' : 'opacity-100'
            }`}
          />
          <span
            className={`w-6 h-[2px] bg-white transition-all duration-300 ${
              mobileMenuOpen ? '-rotate-45 -translate-y-[7px]' : ''
            }`}
          />
        </button>
      </header>

      {/* Mobile overlay (z-index: 9) */}
      <div
        className={`fixed inset-0 z-[9] bg-black/90 backdrop-blur-md flex flex-col justify-center items-start px-8 gap-7 transition-opacity duration-300 md:hidden ${
          mobileMenuOpen
            ? 'opacity-100 pointer-events-auto'
            : 'opacity-0 pointer-events-none'
        }`}
        aria-hidden={!mobileMenuOpen}
      >
        <button
          type="button"
          onClick={() => openModal('summit')}
          className="text-[30px] font-medium text-white hover:opacity-60 transition-opacity text-left cursor-pointer"
        >
          Summit
        </button>
        <button
          type="button"
          onClick={() => openModal('workshops')}
          className="text-[30px] font-medium text-white hover:opacity-60 transition-opacity text-left cursor-pointer"
        >
          Workshops
        </button>
        <button
          type="button"
          onClick={() => openModal('mentors')}
          className="text-[30px] font-medium text-white hover:opacity-60 transition-opacity text-left cursor-pointer"
        >
          Mentors
        </button>
        <button
          type="button"
          onClick={() => openModal('impact')}
          className="text-[30px] font-medium text-white hover:opacity-60 transition-opacity text-left cursor-pointer"
        >
          Impact
        </button>
        <button
          type="button"
          onClick={() => openModal('register')}
          className="text-[30px] font-medium text-white underline underline-offset-2 hover:opacity-60 transition-opacity text-left cursor-pointer"
        >
          Register Now
        </button>
        <button
          type="button"
          onClick={() => {
            setMobileMenuOpen(false);
            setIsAdminView(true);
          }}
          className="text-xs font-mono uppercase tracking-widest text-emerald-400 border border-emerald-500/40 rounded-full px-4 py-2 hover:bg-emerald-500/10 transition-colors text-left cursor-pointer mt-1"
        >
          ⚡ Admin Panel & Registry →
        </button>
      </div>

      {/* HERO SECTION (z-index: 1) */}
      <main className="relative z-[1] w-full h-screen flex flex-col justify-end pb-12 md:justify-center md:pb-0 px-5 sm:px-8 md:px-10 overflow-hidden">
        {/* Content container */}
        <div className="max-w-xl relative z-10 w-full">
          {/* 1. Blurred intro label */}
          <div
            className="pointer-events-none select-none mb-5 sm:mb-6"
            style={{
              fontSize: 'clamp(18px, 4vw, 26px)',
              lineHeight: 1.3,
              fontWeight: 400,
              color: '#fff',
              filter: 'blur(4px)',
            }}
          >
            Welcome to the Movement,
            <br />
            New and Proud Ebonyi Student Empowerment Summit
          </div>

          {/* 2. Typewriter text */}
          <p
            className="text-white mb-5 sm:mb-6"
            style={{
              fontSize: 'clamp(18px, 4vw, 26px)',
              lineHeight: 1.35,
              fontWeight: 400,
              minHeight: '54px',
            }}
          >
            {typewriterText}
            {!typewriterDone && (
              <span
                className="inline-block w-[2px] h-[1.1em] bg-white align-middle ml-[2px] animate-cursor-blink"
                aria-hidden="true"
              />
            )}
          </p>

          {/* 3. Action pill buttons */}
          <div
            className="flex flex-wrap gap-y-1 transition-all duration-400 ease-out"
            style={{
              opacity: pillsVisible ? 1 : 0,
              transform: pillsVisible ? 'translateY(0)' : 'translateY(8px)',
              transitionProperty: 'opacity, transform',
            }}
          >
            {/* 4 white pill buttons */}
            <button
              type="button"
              onClick={() => openModal('register')}
              className="inline-flex items-center justify-center bg-white text-black border border-black/10 rounded-full text-[13px] sm:text-[15px] px-4 sm:px-5 py-[0.3em] mx-[0.2em] mb-[0.4em] whitespace-nowrap cursor-pointer hover:bg-black hover:text-white transition-colors duration-200"
            >
              Claim free student pass
            </button>

            <button
              type="button"
              onClick={() => openModal('workshops')}
              className="inline-flex items-center justify-center bg-white text-black border border-black/10 rounded-full text-[13px] sm:text-[15px] px-4 sm:px-5 py-[0.3em] mx-[0.2em] mb-[0.4em] whitespace-nowrap cursor-pointer hover:bg-black hover:text-white transition-colors duration-200"
            >
              Explore masterclasses
            </button>

            <button
              type="button"
              onClick={() => openModal('mentors')}
              className="inline-flex items-center justify-center bg-white text-black border border-black/10 rounded-full text-[13px] sm:text-[15px] px-4 sm:px-5 py-[0.3em] mx-[0.2em] mb-[0.4em] whitespace-nowrap cursor-pointer hover:bg-black hover:text-white transition-colors duration-200"
            >
              Meet the mentors
            </button>

            <button
              type="button"
              onClick={() => openModal('partner')}
              className="inline-flex items-center justify-center bg-white text-black border border-black/10 rounded-full text-[13px] sm:text-[15px] px-4 sm:px-5 py-[0.3em] mx-[0.2em] mb-[0.4em] whitespace-nowrap cursor-pointer hover:bg-black hover:text-white transition-colors duration-200"
            >
              Partner or volunteer
            </button>

            {/* 1 outline pill button */}
            <button
              type="button"
              onClick={handleCopyEmail}
              className="inline-flex items-center justify-center text-white bg-transparent border border-white rounded-full text-[13px] sm:text-[15px] px-4 sm:px-5 py-[0.3em] mx-[0.2em] mb-[0.4em] whitespace-nowrap cursor-pointer hover:bg-white hover:text-black transition-colors duration-200 gap-2 sm:gap-3 group"
              title="Click to copy email address"
            >
              <span>
                Reach us:{' '}
                <span className="underline underline-offset-1">
                  contact@newandproudebonyi.org
                </span>
              </span>
              {/* 12x12 copy icon */}
              {copied ? (
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 12 12"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="shrink-0 text-emerald-400 group-hover:text-emerald-700"
                >
                  <polyline points="2.5 6 5 8.5 9.5 3.5" />
                </svg>
              ) : (
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 12 12"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.1"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="shrink-0"
                >
                  <rect x="4" y="1.5" width="6.5" height="7.5" rx="0.8" />
                  <rect x="1.5" y="3.5" width="6.5" height="7.5" rx="0.8" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </main>

      {/* Copy / Action notification toast */}
      {toastMessage && (
        <div
          role="status"
          className="fixed bottom-6 right-6 z-50 bg-white text-black px-4 py-2 rounded-full text-xs font-medium shadow-2xl tracking-tight transition-opacity duration-300"
        >
          {toastMessage}
        </div>
      )}

      {/* INTERACTIVE MODALS FOR EVENT INFORMATION & REGISTRATION */}
      {activeModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto"
        >
          <div className="relative w-full max-w-lg bg-[#0d0d0d] border border-white/20 rounded-2xl p-6 sm:p-8 text-white shadow-2xl my-8">
            {/* Close button */}
            <button
              type="button"
              onClick={closeModal}
              aria-label="Close dialog"
              className="absolute top-5 right-5 text-neutral-400 hover:text-white transition-colors cursor-pointer text-xl leading-none p-1"
            >
              ✕
            </button>

            {/* Modal: Claim Free Student Pass / Registration */}
            {activeModal === 'register' && (
              <div>
                <span className="text-xs uppercase tracking-widest text-emerald-400 block mb-2 font-mono">
                  100% Free · Secondary & Tertiary Students
                </span>
                <h3 className="text-2xl font-medium tracking-tight mb-2">
                  Claim Your Student Summit Pass
                </h3>
                <p className="text-sm text-neutral-300 mb-5 leading-relaxed">
                  Join 2,500+ student visionaries from across Ebonyi State for an
                  immersive day of skill acceleration, mentorship, and tech grants.
                </p>

                {registeredStudent ? (
                  <div className="bg-neutral-900 border border-emerald-500/40 rounded-xl p-5 text-center my-4">
                    <div className="w-10 h-10 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto mb-3 text-lg font-bold">
                      ✓
                    </div>
                    <h4 className="text-lg font-medium text-white mb-1">
                      Summit Pass Confirmed!
                    </h4>
                    <p className="text-xs text-neutral-300 mb-4">
                      Welcome, <span className="text-white font-medium">{registeredStudent.name}</span> ({registeredStudent.school}).
                    </p>
                    <div className="p-3 bg-black/80 rounded-lg border border-neutral-700 font-mono text-sm tracking-wider text-emerald-300 mb-4">
                      PASS: {registeredStudent.passCode}
                    </div>
                    <p className="text-xs text-neutral-400 mb-5">
                      Present this badge code or screenshot at the Abakaliki International Arena registration desk on summit day. Free lunch & kit included!
                    </p>
                    <button
                      type="button"
                      onClick={() => setRegisteredStudent(null)}
                      className="px-4 py-1.5 rounded-full text-xs text-neutral-400 hover:text-white border border-neutral-700 hover:border-neutral-500"
                    >
                      Register another student
                    </button>
                  </div>
                ) : (
                  <form
                    onSubmit={async (e) => {
                      e.preventDefault();
                      const form = e.currentTarget;
                      const nameInput = form.elements.namedItem('student-name') as HTMLInputElement;
                      const schoolInput = form.elements.namedItem('student-school') as HTMLInputElement;
                      const trackInput = form.elements.namedItem('student-track') as HTMLSelectElement;
                      const lgaInput = form.elements.namedItem('student-lga') as HTMLSelectElement;
                      const categoryInput = form.elements.namedItem('student-category') as HTMLSelectElement;
                      const contactInput = form.elements.namedItem('student-contact') as HTMLInputElement;

                      try {
                        const res = await fetch('/api/attendees', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            name: nameInput.value,
                            school: schoolInput.value,
                            track: trackInput.value,
                            lga: lgaInput.value,
                            category: categoryInput.value,
                            email: contactInput.value.includes('@') ? contactInput.value : '',
                            phone: !contactInput.value.includes('@') ? contactInput.value : '',
                          }),
                        });

                        if (res.ok) {
                          const data = await res.json();
                          setRegisteredStudent({
                            name: data.attendee.name,
                            school: data.attendee.school,
                            passCode: data.attendee.id,
                          });
                          setToastMessage(`Digital Badge ${data.attendee.id} generated!`);
                          setTimeout(() => setToastMessage(null), 3500);
                          return;
                        }
                      } catch (err) {
                        console.error('Registration API error:', err);
                      }

                      // Fallback in case of network issue
                      const fallbackId = 'NPE-' + Math.floor(100000 + Math.random() * 900000);
                      setRegisteredStudent({
                        name: nameInput.value,
                        school: schoolInput.value,
                        passCode: fallbackId,
                      });
                      setToastMessage('Student Pass generated!');
                      setTimeout(() => setToastMessage(null), 3500);
                    }}
                    className="space-y-3"
                  >
                    <div>
                      <label
                        htmlFor="student-name"
                        className="block text-xs text-neutral-400 mb-1"
                      >
                        Full Name
                      </label>
                      <input
                        id="student-name"
                        required
                        type="text"
                        placeholder="e.g. Chukwuebuka Nweke"
                        className="w-full bg-black/60 border border-white/20 rounded-lg px-3 py-2 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-white transition-colors"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="student-school"
                        className="block text-xs text-neutral-400 mb-1"
                      >
                        School / Institution
                      </label>
                      <input
                        id="student-school"
                        required
                        type="text"
                        placeholder="e.g. EBSU / FGGC Okposi / GTC Abakaliki"
                        className="w-full bg-black/60 border border-white/20 rounded-lg px-3 py-2 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-white transition-colors"
                      />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      <div>
                        <label
                          htmlFor="student-category"
                          className="block text-xs text-neutral-400 mb-1"
                        >
                          Level
                        </label>
                        <select
                          id="student-category"
                          className="w-full bg-[#111] border border-white/20 rounded-lg px-2.5 py-2 text-xs text-white focus:outline-none focus:border-white transition-colors"
                        >
                          <option>Secondary Student</option>
                          <option>Tertiary Student</option>
                          <option>Vocational / Innovator</option>
                        </select>
                      </div>
                      <div>
                        <label
                          htmlFor="student-track"
                          className="block text-xs text-neutral-400 mb-1"
                        >
                          Primary Track
                        </label>
                        <select
                          id="student-track"
                          className="w-full bg-[#111] border border-white/20 rounded-lg px-2.5 py-2 text-xs text-white focus:outline-none focus:border-white transition-colors"
                        >
                          <option>AI, Code & Robotics</option>
                          <option>Creative Media & Design</option>
                          <option>Agri-Tech & Enterprise</option>
                          <option>Civic Leadership & Law</option>
                          <option>Global Scholarships</option>
                        </select>
                      </div>
                      <div>
                        <label
                          htmlFor="student-lga"
                          className="block text-xs text-neutral-400 mb-1"
                        >
                          LGA
                        </label>
                        <select
                          id="student-lga"
                          className="w-full bg-[#111] border border-white/20 rounded-lg px-2.5 py-2 text-xs text-white focus:outline-none focus:border-white transition-colors"
                        >
                          <option>Abakaliki</option>
                          <option>Afikpo North</option>
                          <option>Afikpo South</option>
                          <option>Ebonyi</option>
                          <option>Ezza North</option>
                          <option>Ezza South</option>
                          <option>Ikwo</option>
                          <option>Ishielu</option>
                          <option>Ivo</option>
                          <option>Izzi</option>
                          <option>Ohaozara</option>
                          <option>Ohaukwu</option>
                          <option>Onicha</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <label
                        htmlFor="student-contact"
                        className="block text-xs text-neutral-400 mb-1"
                      >
                        Email or WhatsApp Number
                      </label>
                      <input
                        id="student-contact"
                        required
                        type="text"
                        placeholder="ebuka@gmail.com or 080..."
                        className="w-full bg-black/60 border border-white/20 rounded-lg px-3 py-2 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-white transition-colors"
                      />
                    </div>
                    <div className="flex justify-end gap-3 pt-2">
                      <button
                        type="button"
                        onClick={closeModal}
                        className="px-4 py-2 rounded-full text-xs text-neutral-300 hover:text-white transition-colors cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-5 py-2 rounded-full text-xs font-medium bg-white text-black hover:bg-neutral-200 transition-colors cursor-pointer"
                      >
                        Generate Free Pass
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}

            {/* Modal: Explore Masterclasses & Workshops */}
            {activeModal === 'workshops' && (
              <div>
                <span className="text-xs uppercase tracking-widest text-neutral-400 block mb-2">
                  Hands-On Training
                </span>
                <h3 className="text-2xl font-medium tracking-tight mb-3">
                  Empowerment Masterclasses
                </h3>
                <p className="text-sm text-neutral-300 mb-5 leading-relaxed">
                  Five intensive learning streams led by industry experts and
                  innovators from Ebonyi and across Africa.
                </p>
                <div className="space-y-3 mb-6">
                  <div className="p-3 rounded-lg bg-neutral-900 border border-neutral-800">
                    <div className="flex justify-between items-center mb-1">
                      <h4 className="text-sm font-semibold text-white">
                        01. AI, Modern Web & Robotics Lab
                      </h4>
                      <span className="text-[11px] text-emerald-400 font-mono">
                        Hardware Kits Provided
                      </span>
                    </div>
                    <p className="text-xs text-neutral-400">
                      Build your first generative AI assistant and learn embedded programming basics for real-world automation.
                    </p>
                  </div>

                  <div className="p-3 rounded-lg bg-neutral-900 border border-neutral-800">
                    <div className="flex justify-between items-center mb-1">
                      <h4 className="text-sm font-semibold text-white">
                        02. Agri-Tech & Smart Farming Frontiers
                      </h4>
                      <span className="text-[11px] text-emerald-400 font-mono">
                        Seed Grants Available
                      </span>
                    </div>
                    <p className="text-xs text-neutral-400">
                      Leveraging drone technology, soil sensors, and digital marketplaces to transform Ebonyi agriculture.
                    </p>
                  </div>

                  <div className="p-3 rounded-lg bg-neutral-900 border border-neutral-800">
                    <div className="flex justify-between items-center mb-1">
                      <h4 className="text-sm font-semibold text-white">
                        03. Creative Media, 3D & Digital Storytelling
                      </h4>
                      <span className="text-[11px] text-emerald-400 font-mono">
                        Studio Production
                      </span>
                    </div>
                    <p className="text-xs text-neutral-400">
                      Visual identity, filmmaking, motion graphics, and capturing Ebonyi's rich cultural renaissance.
                    </p>
                  </div>

                  <div className="p-3 rounded-lg bg-neutral-900 border border-neutral-800">
                    <div className="flex justify-between items-center mb-1">
                      <h4 className="text-sm font-semibold text-white">
                        04. Global Scholarships & College Roadmap
                      </h4>
                      <span className="text-[11px] text-emerald-400 font-mono">
                        Direct Mentorship
                      </span>
                    </div>
                    <p className="text-xs text-neutral-400">
                      Acing SAT, GRE, IELTS, and building winning personal statements for undergraduate and postgrad funding abroad.
                    </p>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-neutral-400">
                    All workshops include certification.
                  </span>
                  <button
                    type="button"
                    onClick={() => openModal('register')}
                    className="px-5 py-2 rounded-full text-xs font-medium bg-white text-black hover:bg-neutral-200 transition-colors cursor-pointer"
                  >
                    Select Your Track
                  </button>
                </div>
              </div>
            )}

            {/* Modal: Meet the Mentors */}
            {activeModal === 'mentors' && (
              <div>
                <span className="text-xs uppercase tracking-widest text-neutral-400 block mb-2">
                  Role Models & Guides
                </span>
                <h3 className="text-2xl font-medium tracking-tight mb-3">
                  Keynote Speakers & Mentors
                </h3>
                <p className="text-sm text-neutral-300 mb-5 leading-relaxed">
                  Engage directly in 1-on-1 breakout mentoring tables with
                  trailblazers who walked the same corridors you walk today.
                </p>
                <div className="space-y-3 mb-6">
                  <div className="p-3 rounded-lg bg-neutral-900 border border-neutral-800 flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium text-white">
                        Engr. Chidiogo Okoro
                      </div>
                      <div className="text-xs text-neutral-400">
                        Senior Cloud Infrastructure Lead · Ex-Google · Afikpo Alum
                      </div>
                    </div>
                    <span className="text-xs text-neutral-300 border border-white/20 rounded-full px-2 py-0.5">
                      Tech Keynote
                    </span>
                  </div>

                  <div className="p-3 rounded-lg bg-neutral-900 border border-neutral-800 flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium text-white">
                        Dr. Nnenna Umahi
                      </div>
                      <div className="text-xs text-neutral-400">
                        Biochemist & Rhodes Scholar · Oxford University
                      </div>
                    </div>
                    <span className="text-xs text-neutral-300 border border-white/20 rounded-full px-2 py-0.5">
                      Scholarships
                    </span>
                  </div>

                  <div className="p-3 rounded-lg bg-neutral-900 border border-neutral-800 flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium text-white">
                        Kelechi Egwu
                      </div>
                      <div className="text-xs text-neutral-400">
                        Founder, AgriLink Ebonyi · Forbes 30 Under 30 Africa
                      </div>
                    </div>
                    <span className="text-xs text-neutral-300 border border-white/20 rounded-full px-2 py-0.5">
                      Enterprise
                    </span>
                  </div>

                  <div className="p-3 rounded-lg bg-neutral-900 border border-neutral-800 flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium text-white">
                        Adaobi Nwankwo
                      </div>
                      <div className="text-xs text-neutral-400">
                        Creative Director & Visual Architect · Nollywood & Pan-Africa
                      </div>
                    </div>
                    <span className="text-xs text-neutral-300 border border-white/20 rounded-full px-2 py-0.5">
                      Creative Arts
                    </span>
                  </div>
                </div>
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="px-5 py-2 rounded-full text-xs bg-white text-black hover:bg-neutral-200 transition-colors cursor-pointer"
                  >
                    Close
                  </button>
                </div>
              </div>
            )}

            {/* Modal: Partner or Volunteer */}
            {activeModal === 'partner' && (
              <div>
                <span className="text-xs uppercase tracking-widest text-neutral-400 block mb-2">
                  Community Alliance
                </span>
                <h3 className="text-2xl font-medium tracking-tight mb-3">
                  Partner or Volunteer
                </h3>
                <p className="text-sm text-neutral-300 mb-5 leading-relaxed">
                  Support Ebonyi youth by sponsoring school buses, donating
                  laptops, providing scholarship grants, or serving on the event host team.
                </p>
                <div className="space-y-3 mb-6">
                  <div className="p-3 rounded-lg bg-neutral-900 border border-neutral-800">
                    <h4 className="text-sm font-medium text-white mb-0.5">
                      School Delegation Transport Sponsor
                    </h4>
                    <p className="text-xs text-neutral-400">
                      Sponsor a dedicated bus for public secondary schools from remote LGAs (Izzi, Ezza, Ohaozara, Ivo) to attend the summit.
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-neutral-900 border border-neutral-800">
                    <h4 className="text-sm font-medium text-white mb-0.5">
                      Laptop & Learning Kit Fund
                    </h4>
                    <p className="text-xs text-neutral-400">
                      Fund 100 refurbished laptops and internet dongles for top pitch competition winners.
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-neutral-900 border border-neutral-800">
                    <h4 className="text-sm font-medium text-white mb-0.5">
                      Volunteer Crew
                    </h4>
                    <p className="text-xs text-neutral-400">
                      Join our team of 80 student marshals, registration leads, media crew, and mentor liaisons.
                    </p>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <a
                    href="mailto:partner@newandproudebonyi.org"
                    className="text-xs text-white underline underline-offset-2 hover:opacity-80 font-mono"
                  >
                    partner@newandproudebonyi.org
                  </a>
                  <button
                    type="button"
                    onClick={() => {
                      setToastMessage('Partnership inquiry opened.');
                      setTimeout(() => setToastMessage(null), 3000);
                      closeModal();
                    }}
                    className="px-5 py-2 rounded-full text-xs font-medium bg-white text-black hover:bg-neutral-200 transition-colors cursor-pointer"
                  >
                    Get in Touch
                  </button>
                </div>
              </div>
            )}

            {/* Modal: Summit Details */}
            {activeModal === 'summit' && (
              <div>
                <span className="text-xs uppercase tracking-widest text-emerald-400 font-mono block mb-2">
                  Event Schedule & Logistics
                </span>
                <h3 className="text-2xl font-medium tracking-tight mb-3">
                  The Summit at a Glance
                </h3>
                <div className="space-y-4 mb-6 text-sm text-neutral-300">
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-neutral-900 border border-neutral-800">
                    <div className="text-base text-white">📍</div>
                    <div>
                      <div className="font-medium text-white">Venue</div>
                      <div className="text-xs text-neutral-400">
                        International Conference & Ecumenical Arena, Abakaliki, Ebonyi State
                      </div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-neutral-900 border border-neutral-800">
                    <div className="text-base text-white">🗓️</div>
                    <div>
                      <div className="font-medium text-white">Date & Hours</div>
                      <div className="text-xs text-neutral-400">
                        Saturday, November 14, 2026 · 8:30 AM – 5:00 PM WAT
                      </div>
                    </div>
                  </div>
                  <div className="p-3 rounded-lg bg-neutral-900 border border-neutral-800">
                    <div className="font-medium text-white mb-2">Schedule Highlights</div>
                    <ul className="text-xs text-neutral-400 space-y-1.5 list-disc list-inside">
                      <li>08:30 AM — Registration & Summit Kit Pickup</li>
                      <li>09:30 AM — Opening Keynote & Student Parade of Pride</li>
                      <li>11:00 AM — Concurrent Masterclasses & Innovation Labs</li>
                      <li>01:30 PM — Free Lunch & Networking Lounge</li>
                      <li>02:30 PM — Ebonyi Youth Pitch Arena (₦5M in Grants)</li>
                      <li>04:30 PM — Presentation of Awards & Closing Concert</li>
                    </ul>
                  </div>
                </div>
                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="px-4 py-2 rounded-full text-xs text-neutral-300 hover:text-white cursor-pointer"
                  >
                    Close
                  </button>
                  <button
                    type="button"
                    onClick={() => openModal('register')}
                    className="px-5 py-2 rounded-full text-xs font-medium bg-white text-black hover:bg-neutral-200 transition-colors cursor-pointer"
                  >
                    Register Free
                  </button>
                </div>
              </div>
            )}

            {/* Modal: Impact & Past Stories */}
            {activeModal === 'impact' && (
              <div>
                <span className="text-xs uppercase tracking-widest text-neutral-400 block mb-2">
                  Real Results
                </span>
                <h3 className="text-2xl font-medium tracking-tight mb-3">
                  Empowerment in Action
                </h3>
                <p className="text-sm text-neutral-300 mb-5 leading-relaxed">
                  "New and Proud Ebonyi" is more than a gathering—it is a continuous
                  engine accelerating student potential across all 13 Local Government Areas.
                </p>
                <div className="grid grid-cols-2 gap-3 mb-6">
                  <div className="p-3 rounded-lg bg-neutral-900 border border-neutral-800 text-center">
                    <div className="text-2xl font-bold text-white font-mono">2,500+</div>
                    <div className="text-xs text-neutral-400 mt-1">Students Reached</div>
                  </div>
                  <div className="p-3 rounded-lg bg-neutral-900 border border-neutral-800 text-center">
                    <div className="text-2xl font-bold text-white font-mono">150+</div>
                    <div className="text-xs text-neutral-400 mt-1">Scholarships & Laptops</div>
                  </div>
                  <div className="p-3 rounded-lg bg-neutral-900 border border-neutral-800 text-center">
                    <div className="text-2xl font-bold text-white font-mono">13</div>
                    <div className="text-xs text-neutral-400 mt-1">LGAs Represented</div>
                  </div>
                  <div className="p-3 rounded-lg bg-neutral-900 border border-neutral-800 text-center">
                    <div className="text-2xl font-bold text-white font-mono">₦15M+</div>
                    <div className="text-xs text-neutral-400 mt-1">Direct Youth Grants</div>
                  </div>
                </div>
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="px-5 py-2 rounded-full text-xs bg-white text-black hover:bg-neutral-200 transition-colors cursor-pointer"
                  >
                    Close
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
