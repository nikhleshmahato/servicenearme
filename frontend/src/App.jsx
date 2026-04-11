import React, { useState, useEffect } from 'react';
import './index.css';
import fallbackData from './services.json';

export default function App() {
    const [services, setServices] = useState([]);
    const [filteredServices, setFilteredServices] = useState([]);
    const [category, setCategory] = useState("all");
    const [searchQuery, setSearchQuery] = useState("");
    const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');
    const [loading, setLoading] = useState(true);
    const [visibleCount, setVisibleCount] = useState(12);
    
    // Modals
    const [activeModal, setActiveModal] = useState(null); // 'auth', 'help', 'report', 'detail', 'bookings', 'dashboard'
    const [activeService, setActiveService] = useState(null);
    const [bookings, setBookings] = useState([]);
    const [reviews, setReviews] = useState([]);
    const [reviewRating, setReviewRating] = useState(5);
    const [reviewComment, setReviewComment] = useState("");
    
    // Authentication
    const [user, setUser] = useState(null);
    const [authMode, setAuthMode] = useState('login'); // 'login' or 'signup'
    const [authRole, setAuthRole] = useState('user'); // 'user' or 'worker'

    useEffect(() => {
        // Preloader max 3 seconds length as requested
        const timer = setTimeout(() => {
            setLoading(false);
        }, 3000);
        
        // Movable Doodle Generation (5-10% opacity)
        const doodles = ['✨', '🌟', '🛠️', '🔧', '🧹', '🎨', '💼'];
        const container = document.getElementById('doodle-container');
        const intervals = [];
        if (container) {
            container.innerHTML = '';
            for(let i=0; i<20; i++) {
                const doodle = document.createElement('div');
                doodle.className = 'doodle text-3xl transition-all duration-[5000ms] ease-in-out';
                
                let startX = Math.random() * 100;
                let startY = Math.random() * 100;
                doodle.style.left = `${startX}vw`;
                doodle.style.top = `${startY}vh`;
                doodle.innerText = doodles[Math.floor(Math.random() * doodles.length)];
                container.appendChild(doodle);
                
                const intId = setInterval(() => {
                    startX += (Math.random() - 0.5) * 20;
                    startY += (Math.random() - 0.5) * 20;
                    if(startX < 0) startX = 10; if(startX > 100) startX = 90;
                    if(startY < 0) startY = 10; if(startY > 100) startY = 90;
                    doodle.style.left = `${startX}vw`;
                    doodle.style.top = `${startY}vh`;
                }, 5000);
                intervals.push(intId);
            }
        }
        
        return () => {
            clearTimeout(timer);
            intervals.forEach(clearInterval);
        };
    }, []);

    useEffect(() => {
        fetch('/api/services')
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data) && data.length > 0) {
                    setServices(data);
                    setFilteredServices(data);
                } else {
                    console.error("API returned empty/error, using frontend fallback.");
                    setServices(fallbackData);
                    setFilteredServices(fallbackData);
                }
            })
            .catch(err => {
                console.error("Network error, backend is offline. Local DB override injected.", err);
                setServices(fallbackData);
                setFilteredServices(fallbackData);
            });
            
        // Check for persistent session
        const token = localStorage.getItem('token');
        if (token) {
            // Basic self-check can be added here
            const savedUser = JSON.parse(localStorage.getItem('user'));
            if (savedUser) setUser(savedUser);
        }

        if (theme === 'dark') {
            document.body.classList.add('dark');
        } else {
            document.body.classList.remove('dark');
        }
    }, [theme]);
    
    useEffect(() => {
        let filtered = [...services];
        if (category !== 'all') {
            filtered = filtered.filter(s => s.category === category);
        }
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(s => 
                s.name.toLowerCase().includes(query) || 
                s.area.toLowerCase().includes(query) ||
                s.category.toLowerCase().includes(query)
            );
        }
        
        // Sorting Logic: Prioritize Rating (Highest first)
        filtered.sort((a, b) => b.rating - a.rating);
        
        setFilteredServices(filtered);
    }, [category, searchQuery, services]);

    const toggleTheme = () => {
        const newTheme = theme === 'dark' ? 'light' : 'dark';
        setTheme(newTheme);
        localStorage.setItem('theme', newTheme);
    };

    const showToast = (msg) => {
        const toast = document.getElementById('toast');
        const msgEl = document.getElementById('toast-msg');
        if (toast && msgEl) {
            msgEl.innerText = msg;
            toast.classList.remove('opacity-0', 'translate-y-10');
            setTimeout(() => {
                toast.classList.add('opacity-0', 'translate-y-10');
            }, 3000);
        }
    };

    const handleBooking = async () => {
        if (!user) {
            setActiveModal('auth');
            showToast('Please login to book a service');
            return;
        }
        if (activeService) {
            try {
                const token = localStorage.getItem('token');
                const res = await fetch('/api/bookings', {
                    method: 'POST',
                    headers: { 
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        serviceId: activeService.id,
                        serviceName: activeService.name,
                        amount: activeService.amount
                    })
                });
                if (res.ok) {
                    const newBooking = await res.json();
                    setBookings([newBooking, ...bookings]);
                    showToast('Booking Confirmed Successfully!');
                    setActiveModal(null);
                } else {
                    showToast('Booking failed. Please try again.');
                }
            } catch (err) {
                showToast('Network error');
            }
        }
    };

    const fetchMyBookings = async () => {
        const token = localStorage.getItem('token');
        if (!token) return;
        try {
            const res = await fetch('/api/bookings/my', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (res.ok) setBookings(data);
        } catch (err) {
            console.error(err);
        }
    };

    const fetchReviews = async (serviceId) => {
        try {
            const res = await fetch(`/api/reviews/${serviceId}`);
            const data = await res.json();
            if (res.ok) setReviews(data);
        } catch (err) {
            console.error(err);
        }
    };

    const handleAddReview = async (e) => {
        e.preventDefault();
        if (!user) { showToast('Please login to review'); return; }
        const token = localStorage.getItem('token');
        try {
            const res = await fetch('/api/reviews', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    serviceId: activeService.id,
                    rating: reviewRating,
                    comment: reviewComment
                })
            });
            if (res.ok) {
                const newReview = await res.json();
                setReviews([newReview, ...reviews]);
                setReviewComment("");
                showToast('Review added!');
            }
        } catch (err) {
            showToast('Error adding review');
        }
    };

    const handleAuthSubmit = async (e) => {
        e.preventDefault();
        const email = e.target.email.value;
        const password = e.target.password.value;
        
        const endpoint = authMode === 'login' ? '/api/auth/login' : '/api/auth/signup';
        const payload = { email, password };
        
        if (authMode === 'signup') {
            payload.name = e.target.name.value;
            payload.role = authRole;
            if (authRole === 'worker') {
                payload.business = {
                    name: e.target.bizName.value,
                    category: e.target.bizCategory.value,
                    area: e.target.bizArea.value,
                    image: e.target.bizImage.value,
                }
            }
        }
        
        try {
            const res = await fetch(`${endpoint}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const data = await res.json();
            if (res.ok) {
                // Save JWT token and user info
                localStorage.setItem('token', data.token);
                localStorage.setItem('user', JSON.stringify(data));
                setUser(data);
                showToast(`${authMode === 'login' ? 'Welcome back!' : 'Account created!'} 🎉`);
                setActiveModal('dashboard'); // Redirect to dashboard immediately
            } else {
                showToast(data.error || 'Authentication failed');
            }
        } catch (err) {
            showToast('Network error');
        }
    };

    const categories = ['all', 'Hotel', 'Electrician', 'Plumber', 'Tutors', 'Food', 'Medicine', 'Salon', 'Mechanic', 'Cleaning', 'Photography', 'Event', 'Interior', 'Pet', 'IT'];
    const categoryEmojis = { Hotel: '🏨', Electrician: '⚡', Plumber: '🔧', Tutors: '📚', Food: '🍕', Medicine: '💊', Salon: '✂️', Mechanic: '🛠️', Cleaning: '🧹', Photography: '📷', Event: '🎉', Interior: '🏠', Pet: '🐾', IT: '💻' };

    return (
        <div className="min-h-screen relative">
            <div id="doodle-container" className="fixed inset-0 z-[-1] overflow-hidden pointer-events-none"></div>

            {loading && (
                <div id="preloader" style={{ opacity: 1, visibility: 'visible' }}>
                    <div className="loader-logo">SNM</div>
                    <div className="loader-bar">
                        <div className="loader-progress"></div>
                    </div>
                    <p className="text-white/40 text-[10px] uppercase tracking-[0.3em] mt-6 font-black">Elite Local Discovery</p>
                </div>
            )}

            <nav className="glass-nav sticky top-0 z-50 px-6 py-4 flex flex-col md:flex-row items-center gap-6 transition-all duration-300">
                <div className="flex items-center space-x-3 shrink-0">
                    <div className="bg-white text-primary font-anton text-xl p-2 rounded-xl shadow-lg leading-none">SNM</div>
                    <span className="text-3xl font-anton tracking-wide cursor-pointer text-white hover:text-cta transition-colors hidden lg:block" onClick={() => window.location.reload()}>Service Near Me</span>
                </div>

                <div className="flex-1 flex flex-col md:flex-row items-center gap-3 w-full">
                    <div className="relative w-full md:w-64">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-auto cursor-pointer text-cta hover:text-white transition-colors" title="Use GPS Location">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path></svg>
                        </div>
                        <input 
                            id="nav-location" 
                            type="text" 
                            placeholder="Type area (e.g. Sakchi)" 
                            className="w-full bg-white/10 border border-white/10 rounded-2xl pl-12 pr-4 py-2.5 outline-none text-white text-sm font-medium placeholder:text-white/40 focus:bg-white/20 transition-all font-serif"
                         />
                    </div>
                    
                    <div className="relative flex-1 w-full">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-white/40">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                        </div>
                        <input 
                            id="nav-search"
                            type="text" 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search for services..." 
                            className="w-full bg-white/10 border border-white/10 rounded-2xl pl-10 pr-4 py-2.5 outline-none text-white text-sm font-medium placeholder:text-white/30 focus:bg-white/20 transition-all"
                         />
                    </div>
                </div>

                <div className="flex items-center space-x-6 shrink-0">
                    <button onClick={toggleTheme} className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all" title="Toggle Theme">
                        {theme === 'light' ? 
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>
                            :
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"></path></svg>
                        }
                    </button>

                    <button onClick={() => { setActiveModal('bookings'); fetchMyBookings(); }} className="bg-white/10 hover:bg-white/20 text-white p-2.5 rounded-full transition-all relative" title="My Bookings">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path></svg>
                        {bookings.length > 0 && <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-cta rounded-full"></span>}
                    </button>

                    {!user ? (
                        <div id="auth-buttons" className="flex items-center space-x-4">
                            <button onClick={() => { setActiveModal('auth'); setAuthMode('login'); }} className="text-white hover:text-cta transition-colors font-black text-xs uppercase tracking-widest">Login</button>
                            <button onClick={() => { setActiveModal('auth'); setAuthMode('signup'); }} className="bg-cta text-[#0F172A] px-6 py-2.5 rounded-full font-black text-xs uppercase tracking-widest hover:bg-white hover:text-primary transition-all shadow-lg">Sign Up</button>
                        </div>
                    ) : (
                        <div className="flex items-center space-x-4">
                            <div className="flex flex-col items-end cursor-pointer hover:opacity-80 transition-all" onClick={() => setActiveModal('dashboard')}>
                                <span className="text-sm font-black text-white leading-none">{user.name}</span>
                                <span className="text-[10px] font-bold text-cta uppercase tracking-widest mt-1">{user.role} Dashboard</span>
                            </div>
                            <button onClick={() => { setUser(null); localStorage.removeItem('token'); localStorage.removeItem('user'); }} className="bg-white/10 hover:bg-white/20 text-white p-2.5 rounded-full transition-all">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>
                            </button>
                        </div>
                    )}
                </div>
            </nav>
            
            <div className="mt-16 max-w-5xl mx-auto px-4 animate-fade-in-up stagger-3">
                <div className="bg-gradient-to-r from-primary to-highlight p-1 rounded-[40px] shadow-2xl overflow-hidden group cursor-pointer">
                    <div className="bg-bg-dark rounded-[38px] p-8 md:p-12 flex flex-col md:flex-row items-center justify-between relative overflow-hidden">
                        <div className="relative z-10 text-left md:max-w-md">
                            <span className="bg-cta text-bg-dark text-[10px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest mb-6 inline-block">Exclusive Offer</span>
                            <h2 className="text-3xl md:text-4xl font-black text-white uppercase tracking-tighter leading-none mb-4">First Booking? <br /><span className="text-cta">Get 20% OFF</span></h2>
                            <p className="text-white/60 font-medium mb-8">Experience premium services at unbeatable prices. Limited time offer for new members.</p>
                            <button onClick={() => { setActiveModal('auth'); setAuthMode('signup'); }} className="bg-white text-bg-dark font-black px-8 py-3.5 rounded-2xl hover:bg-cta transition-all uppercase tracking-widest text-xs btn-hover-effect">Claim Discount</button>
                        </div>
                        <div className="mt-10 md:mt-0 relative z-10 flex items-center justify-center">
                            <div className="w-40 h-40 bg-cta/10 rounded-full flex items-center justify-center border border-cta/20 group-hover:scale-110 transition-transform duration-700">
                                 <div className="text-6xl group-hover:rotate-12 transition-transform">🎁</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Quick Stats Section */}
            <div className="max-w-5xl mx-auto px-6 mt-12 grid grid-cols-2 md:grid-cols-4 gap-6 animate-fade-in-up stagger-4">
                {[
                    { label: 'Services', value: '450+', icon: '🛠️' },
                    { label: 'Local Areas', value: '25+', icon: '📍' },
                    { label: 'Happy Users', value: '10k+', icon: '🤝' },
                    { label: 'Verified', value: '100%', icon: '✅' }
                ].map((stat, i) => (
                    <div key={i} className="bg-white dark:bg-white/5 p-6 rounded-[30px] border border-gray-100 dark:border-white/10 text-center shadow-lg hover:rotate-2 transition-transform">
                        <div className="text-2xl mb-2">{stat.icon}</div>
                        <div className="text-xl font-black text-primary dark:text-cta">{stat.value}</div>
                        <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{stat.label}</div>
                    </div>
                ))}
            </div>

            {/* Top Rated Services (Expansion) */}
            <section className="mt-20 px-6">
                <div className="max-w-7xl mx-auto">
                    <div className="flex justify-between items-end mb-10 px-4">
                        <div>
                            <span className="text-cta font-black text-[10px] uppercase tracking-[0.3em]">Curated Weekly</span>
                            <h2 className="text-4xl font-black text-primary dark:text-white uppercase tracking-tighter">Top Rated Professionals</h2>
                        </div>
                        <div className="hidden md:flex gap-2">
                            <span className="p-2 bg-gray-100 dark:bg-white/5 rounded-full text-gray-400">←</span>
                            <span className="p-2 bg-primary dark:bg-cta text-bg-dark rounded-full cursor-pointer hover:scale-110 transition-all">→</span>
                        </div>
                    </div>
                    
                    <div className="flex gap-6 overflow-x-auto no-scrollbar pb-8 px-4">
                        {services.filter(s => s.rating >= 4.8).slice(0, 6).map(s => (
                            <div key={s.id} onClick={() => { setActiveService(s); setActiveModal('detail'); fetchReviews(s.id); }} className="min-w-[280px] bg-white dark:bg-white/5 p-4 rounded-[32px] border border-gray-100 dark:border-white/10 cursor-pointer shadow-lg hover:ring-2 ring-cta transition-all group">
                                <img src={s.image} className="w-full h-40 object-cover rounded-2xl mb-4 grayscale group-hover:grayscale-0 transition-all" alt={s.name} />
                                <div className="flex justify-between items-center mb-2">
                                    <h4 className="font-black dark:text-white uppercase text-sm truncate pr-2">{s.name}</h4>
                                    <span className="text-cta font-black text-xs">★ {s.rating}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center">
                                        <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path></svg> {s.area}
                                    </div>
                                    <span className="text-[8px] font-black bg-white/5 px-2 py-0.5 rounded text-gray-500">{s.category}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            <section id="category-selector" className="px-6 mb-20 overflow-x-auto no-scrollbar mt-12">
                <div className="flex justify-center min-w-max gap-4" id="category-filters">
                    {categories.map(cat => (
                        <button 
                            key={cat} 
                            onClick={() => setCategory(cat)} 
                            className={`category-btn ${category === cat ? 'active' : 'bg-white dark:bg-white/5'} px-8 py-3 rounded-2xl text-xs font-black border border-gray-200 dark:border-white/10 hover:border-primary transition-all uppercase tracking-widest flex items-center`}
                        >
                            {cat !== 'all' && <span className="mr-2">{categoryEmojis[cat]}</span>} {cat}
                        </button>
                    ))}
                </div>
            </section>

            <main className="px-6 pb-32 max-w-7xl mx-auto">
                <div className="flex flex-col space-y-6 max-w-4xl mx-auto">
                    {filteredServices.length > 0 ? (
                        <>
                            {filteredServices.slice(0, visibleCount).map(service => (
                                <div key={service.id} className="flex flex-col md:flex-row bg-white dark:bg-white/5 p-4 rounded-[32px] gap-6 card-glow border border-gray-100 dark:border-white/10 items-center animate-fade-in-up">
                                    <img src={service.image} className="w-full md:w-64 h-48 md:h-full object-cover rounded-3xl" alt={service.name} />
                                    <div className="flex-1 w-full space-y-4">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="text-[9px] font-black bg-primary/10 dark:bg-cta/10 text-primary dark:text-cta px-2 py-0.5 rounded uppercase tracking-wider">{service.category}</span>
                                                    {service.verified && <span className="text-blue-500 text-xs">Verified ✓</span>}
                                                </div>
                                                <h3 className="text-2xl font-black text-primary dark:text-white uppercase tracking-tighter">{service.name}</h3>
                                                <p className="text-gray-500 font-medium text-sm flex items-center"><svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path></svg> {service.area}</p>
                                            </div>
                                            <span className="bg-cta/10 text-cta font-black px-3 py-1 rounded-xl text-sm">₹{service.amount}</span>
                                        </div>
                                        <p className="text-gray-600 dark:text-gray-400 font-medium text-sm line-clamp-2">{service.description}</p>
                                        <div className="flex flex-wrap gap-4 items-center">
                                            <button onClick={() => { setActiveService(service); setActiveModal('detail'); fetchReviews(service.id); }} className="bg-primary text-bg-dark hover:bg-highlight px-6 py-3 rounded-2xl font-black text-xs uppercase transition-all shadow-md">View Details</button>
                                            <span className="flex items-center text-cta font-black text-sm"><svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path></svg> {service.rating}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            
                            {filteredServices.length > visibleCount && (
                                <div className="text-center pt-8">
                                    <button 
                                        onClick={() => setVisibleCount(filteredServices.length)}
                                        className="bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 text-primary dark:text-white border border-gray-200 dark:border-white/10 px-12 py-4 rounded-full font-black text-xs uppercase tracking-[0.3em] transition-all hover:scale-105 active:scale-95 shadow-xl"
                                    >
                                        Expand All Services
                                    </button>
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="text-center py-40">
                            <div className="bg-gray-100 dark:bg-white/5 inline-block p-10 rounded-full mb-8">
                                <svg className="w-16 h-16 text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 9.172a4 4 0 0112.728 0M9 10a5 5 0 0110 0m-5 10a3 3 0 01-3-3V7a3 3 0 016 0v10a3 3 0 01-3 3z"></path></svg>
                            </div>
                            <p className="text-4xl font-black text-primary/20 dark:text-white/20 uppercase tracking-tighter">No Results Found</p>
                        </div>
                    )}
                </div>
            </main>

            {/* Modals */}
            {activeModal === 'auth' && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="modal-overlay absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setActiveModal(null)}></div>
                    <div className="bg-bg-dark border border-white/10 w-full max-w-4xl max-h-[90vh] rounded-[48px] relative z-10 overflow-hidden flex flex-col md:flex-row shadow-2xl modal-enter">
                        {/* Auth Design Pane */}
                        <div className="hidden md:flex w-1/2 bg-gradient-to-br from-primary via-bg-dark to-highlight p-12 flex-col justify-between relative min-h-[500px]">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-cta/10 blur-[100px] -mr-32 -mt-32"></div>
                            <div className="z-10">
                                <div className="text-4xl font-anton text-white mb-4">SNM</div>
                                <h3 className="text-4xl font-black text-white leading-tight uppercase tracking-tighter">Your local <br/><span className="text-cta">services,</span><br/> simplified.</h3>
                            </div>
                            <div className="z-10">
                                <p className="text-white/40 text-xs font-bold uppercase tracking-[0.3em] mb-4">Join 10,000+ users today</p>
                                <div className="flex -space-x-3">
                                    {[1,2,3,4].map(i => <div key={i} className="w-10 h-10 rounded-full border-2 border-bg-dark bg-gray-800" style={{backgroundColor: `hsl(${i*40}, 50%, 50%)`}}></div>)}
                                    <div className="w-10 h-10 rounded-full border-2 border-bg-dark bg-cta flex items-center justify-center text-[10px] font-black">+9k</div>
                                </div>
                            </div>
                        </div>

                        {/* Auth Form Pane */}
                        <div className="flex-1 p-8 md:p-14 overflow-y-auto bg-bg-dark">
                            <div className="flex justify-between items-center mb-10">
                                <div>
                                    <h2 className="text-3xl font-black text-white uppercase tracking-tighter">{authMode === 'login' ? 'Sign In' : 'Create Account'}</h2>
                                    <p className="text-gray-500 text-xs mt-1 font-bold italic">{authMode === 'login' ? 'Elevate your discovery' : 'Start your journey with us'}</p>
                                </div>
                                <button onClick={() => setActiveModal(null)} className="p-2 transition-hover text-white hover:text-cta bg-white/5 rounded-full"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg></button>
                            </div>

                            <form onSubmit={handleAuthSubmit} className="space-y-5">
                                <div className="flex gap-2 p-1 bg-white/5 rounded-2xl mb-4 text-[#0F172A]">
                                    <button type="button" onClick={() => setAuthRole('user')} className={`flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${authRole === 'user' ? 'bg-cta text-[#0F172A] shadow-lg' : 'text-gray-500'}`}>User</button>
                                    <button type="button" onClick={() => setAuthRole('worker')} className={`flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${authRole === 'worker' ? 'bg-cta text-[#0F172A] shadow-lg' : 'text-gray-500'}`}>Worker</button>
                                </div>

                                {authMode === 'signup' && (
                                    <div className="group">
                                        <label className="block text-[9px] font-black text-gray-600 mb-1 px-2 uppercase tracking-[0.2em]">Display Name</label>
                                        <input name="name" required placeholder="John Doe" className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-3.5 focus:border-cta focus:bg-white/[0.08] outline-none transition-all text-white text-sm" />
                                    </div>
                                )}

                                {authMode === 'signup' && authRole === 'worker' && (
                                    <div className="grid grid-cols-2 gap-3 animate-scale-in">
                                        <input name="bizName" required placeholder="Business Name" className="bg-white/5 border border-white/10 rounded-2xl px-5 py-3 text-white text-xs" />
                                        <input name="bizCategory" required placeholder="Category" className="bg-white/5 border border-white/10 rounded-2xl px-5 py-3 text-white text-xs" />
                                    </div>
                                )}

                                <div class="group">
                                    <label class="block text-[9px] font-black text-gray-400 mb-1 px-2 uppercase tracking-[0.2em]">Email Address</label>
                                    <input name="email" required type="email" placeholder="email@example.com" class="w-full bg-white/10 border border-white/20 rounded-2xl px-6 py-3.5 focus:border-cta focus:bg-white/[0.15] outline-none transition-all text-white text-sm shadow-inner" />
                                </div>
                                <div class="group">
                                    <label class="block text-[9px] font-black text-gray-400 mb-1 px-2 uppercase tracking-[0.2em]">Security Key</label>
                                    <input name="password" required type="password" placeholder="••••••••" class="w-full bg-white/10 border border-white/20 rounded-2xl px-6 py-3.5 focus:border-cta focus:bg-white/[0.15] outline-none transition-all text-white text-sm shadow-inner" />
                                </div>

                                <button type="submit" className="w-full bg-cta text-[#0F172A] font-black py-4 rounded-2xl hover:bg-white hover:scale-[1.02] transition-all uppercase tracking-[0.2em] text-xs shadow-lg shadow-cta/10 mt-4">Continue</button>
                            </form>
                            <p className="mt-8 text-[10px] font-black text-gray-500 dark:text-gray-400 text-center uppercase tracking-[0.15em]">
                                {authMode === 'login' ? "Don't have an account?" : "Already a member?"} <span className="cursor-pointer text-cta hover:text-white underline ml-1" onClick={() => setAuthMode(authMode === 'login' ? 'signup' : 'login')}>{authMode === 'login' ? 'Create one' : 'Sign in here'}</span>
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* User Dashboard Modal Expansion */}
            {activeModal === 'dashboard' && user && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="modal-overlay absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setActiveModal(null)}></div>
                    <div className="bg-bg-dark border border-white/10 w-full max-w-5xl h-[80vh] rounded-[48px] relative z-10 flex overflow-hidden shadow-2xl modal-enter">
                        {/* Sidebar */}
                        <div className="w-64 bg-white/5 border-r border-white/10 p-8 hidden md:block">
                            <div className="text-2xl font-anton text-cta mb-12">SNM</div>
                            <nav className="space-y-6">
                                <div className="text-white font-black text-xs uppercase tracking-widest cursor-pointer hover:text-cta transition-colors flex items-center"><span className="mr-3">📊</span> Overview</div>
                                <div className="text-gray-500 font-black text-xs uppercase tracking-widest cursor-pointer hover:text-white transition-colors flex items-center" onClick={() => setActiveModal('bookings')}><span className="mr-3">🎟️</span> My Bookings</div>
                                <div className="text-gray-500 font-black text-xs uppercase tracking-widest cursor-pointer hover:text-white transition-colors flex items-center"><span className="mr-3">⚙️</span> Settings</div>
                                <div className="text-red-500/50 font-black text-xs uppercase tracking-widest cursor-pointer hover:text-red-500 transition-colors pt-20" onClick={() => { setUser(null); localStorage.clear(); setActiveModal(null); }}><span className="mr-3">🚪</span> Logout</div>
                            </nav>
                        </div>
                        {/* Content */}
                        <div className="flex-1 p-12 overflow-y-auto">
                            <div className="flex justify-between items-start mb-12">
                                <div>
                                    <span className="text-cta font-black text-[10px] uppercase tracking-widest">Dashboard Area</span>
                                    <h2 className="text-4xl font-black text-white uppercase tracking-tighter">Welcome, {user.name}</h2>
                                </div>
                                <button onClick={() => setActiveModal(null)} className="p-3 bg-white/5 rounded-full text-gray-500 hover:text-white transition-all"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg></button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                                <div className="bg-white/5 p-8 rounded-[32px] border border-white/10">
                                    <p className="text-gray-500 text-[10px] font-black uppercase mb-2">Active Orders</p>
                                    <div className="text-4xl font-black text-white">{bookings.length}</div>
                                </div>
                                <div className="bg-white/5 p-8 rounded-[32px] border border-white/10">
                                    <p className="text-gray-500 text-[10px] font-black uppercase mb-2">Member Since</p>
                                    <div className="text-xl font-black text-white">April 2026</div>
                                </div>
                                <div className="bg-cta p-8 rounded-[32px] text-primary">
                                    <p className="text-primary/60 text-[10px] font-black uppercase mb-2">Points Earned</p>
                                    <div className="text-4xl font-black">1,250</div>
                                </div>
                            </div>

                            <h3 className="text-white font-black uppercase text-sm mb-6 flex items-center">Recent Activity <span className="ml-3 h-[1px] flex-1 bg-white/10"></span></h3>
                            <div className="space-y-4">
                                {bookings.slice(0, 3).map((b, i) => (
                                    <div key={i} className="flex justify-between items-center p-6 bg-white/5 rounded-2xl border border-white/10 hover:bg-white/[0.08] transition-all">
                                        <div className="flex items-center">
                                            <div className="w-10 h-10 bg-cta/10 rounded-xl flex items-center justify-center mr-4 text-xl">📦</div>
                                            <div>
                                                <p className="text-white font-bold text-sm uppercase">{b.serviceName}</p>
                                                <p className="text-gray-500 text-[10px] font-bold">Confirmed • {b.date}</p>
                                            </div>
                                        </div>
                                        <div className="text-white font-black text-sm">₹{b.amount}</div>
                                    </div>
                                ))}
                                {bookings.length === 0 && <p className="text-gray-500 italic text-sm">No activity recorded yet.</p>}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {activeModal === 'detail' && activeService && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="modal-overlay absolute inset-0 bg-black/50" onClick={() => setActiveModal(null)}></div>
                    <div className="bg-bg-dark border border-white/10 w-full max-w-2xl rounded-[40px] relative z-10 p-12 shadow-2xl modal-enter max-h-[90vh] overflow-y-auto">
                        <button onClick={() => setActiveModal(null)} className="absolute top-6 right-6 text-gray-400 hover:text-white"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg></button>
                        <img src={activeService.image} className="w-full h-64 object-cover rounded-3xl mb-8 border border-white/10" />
                        <h2 className="text-4xl font-black text-white uppercase tracking-tighter mb-4">{activeService.name}</h2>
                        <div className="flex justify-between items-center mb-6">
                            <span className="text-cta text-xl font-black">₹{activeService.amount}</span>
                            <span className="text-gray-400 font-medium">{activeService.area}</span>
                        </div>
                        <p className="text-gray-300 text-base mb-8">{activeService.description}</p>
                        
                        <div className="border-t border-white/10 pt-8 mb-8">
                            <h4 className="text-white font-black uppercase text-sm mb-6">User Reviews</h4>
                            <div className="space-y-4 mb-8">
                                {reviews.length > 0 ? reviews.map((r, i) => (
                                    <div key={i} className="bg-white/5 p-4 rounded-2xl border border-white/10">
                                        <div className="flex justify-between mb-1">
                                            <span className="text-white font-bold text-sm">{r.userName}</span>
                                            <span className="text-cta font-black text-xs">★ {r.rating}</span>
                                        </div>
                                        <p className="text-gray-400 text-xs">{r.comment}</p>
                                    </div>
                                )) : <p className="text-gray-500 text-xs italic">No reviews yet. Be the first!</p>}
                            </div>

                            {user && (
                                <form onSubmit={handleAddReview} className="space-y-4">
                                    <div className="flex gap-4 items-center">
                                        <select value={reviewRating} onChange={(e) => setReviewRating(Number(e.target.value))} className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white text-xs outline-none">
                                            {[5,4,3,2,1].map(n => <option key={n} value={n} className="bg-bg-dark">{n} Stars</option>)}
                                        </select>
                                        <input value={reviewComment} onChange={(e) => setReviewComment(e.target.value)} placeholder="Write a review..." className="flex-1 bg-white/5 border border-white/10 rounded-xl px-6 py-2.5 text-white text-sm outline-none" required />
                                        <button type="submit" className="bg-cta text-primary font-black px-6 py-2.5 rounded-xl text-[10px] uppercase truncate">Post</button>
                                    </div>
                                </form>
                            )}
                        </div>

                        <button onClick={handleBooking} className="w-full bg-primary text-bg-dark font-black py-4 rounded-2xl hover:bg-white uppercase tracking-[0.2em] text-xs">Book Now</button>
                    </div>
                </div>
            )}

            {activeModal === 'bookings' && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="modal-overlay absolute inset-0 bg-black/50" onClick={() => setActiveModal(null)}></div>
                    <div className="bg-bg-dark border border-white/10 w-full max-w-2xl rounded-[40px] relative z-10 p-12 shadow-2xl modal-enter max-h-[80vh] overflow-y-auto">
                        <h2 className="text-4xl font-black mb-8 text-white uppercase tracking-tighter">Your Reservations</h2>
                        <div className="space-y-4">
                            {bookings.length > 0 ? bookings.map((b, i) => (
                                <div key={i} className="bg-white/5 p-4 rounded-2xl border border-white/10 flex justify-between items-center">
                                    <div>
                                        <div className="text-white font-black text-lg uppercase">{b.name}</div>
                                        <div className="text-gray-400 text-sm">{b.date}</div>
                                    </div>
                                    <div className="flex flex-col items-end">
                                        <div className="text-cta font-black">₹{b.amount}</div>
                                        <div className={`text-[10px] uppercase font-black px-2 py-0.5 rounded mt-1 ${b.status === 'confirmed' ? 'bg-green-500/20 text-green-500' : 'bg-yellow-500/20 text-yellow-500'}`}>{b.status}</div>
                                    </div>
                                </div>
                            )) : <p className="text-gray-500">No bookings yet.</p>}
                        </div>
                        <button onClick={() => setActiveModal(null)} className="w-full mt-10 bg-white/5 hover:bg-white/10 text-white font-black py-4 rounded-2xl uppercase tracking-widest text-xs">Close</button>
                    </div>
                </div>
            )}

            <div id="toast" className="fixed bottom-10 left-1/2 transform -translate-x-1/2 bg-bg-dark border border-white/10 text-white px-8 py-4 rounded-full shadow-2xl font-black text-xs uppercase tracking-widest transition-all duration-300 opacity-0 pointer-events-none z-[200] translate-y-10 flex items-center shadow-primary/20">
                <svg className="w-5 h-5 mr-3 text-cta" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                <span id="toast-msg">Notification</span>
            </div>
            
            <footer className="footer-bg py-20 border-t border-white/5 text-center">
                <p className="text-[10px] font-black text-gray-600 uppercase tracking-[0.4em] mb-2">Built for Hack Horizon • Team InnoVentures</p>
                <p className="text-gray-500 text-sm">Email: support@servicenearme.com | Toll-Free: 1-800-123-4567</p>
            </footer>
        </div>
    );
}
