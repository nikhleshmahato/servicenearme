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
    
    // Modals
    const [activeModal, setActiveModal] = useState(null); // 'auth', 'help', 'report', 'detail', 'bookings'
    const [activeService, setActiveService] = useState(null);
    const [bookings, setBookings] = useState([]);
    
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
                doodle.className = 'absolute text-3xl pointer-events-none transition-all duration-[5000ms] ease-in-out';
                doodle.style.opacity = Math.random() * 0.05 + 0.05; // 5% to 10%
                
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
            
        if (theme === 'dark') {
            document.body.classList.add('dark');
        } else {
            document.body.classList.remove('dark');
        }
    }, [theme]);
    
    useEffect(() => {
        let filtered = services;
        if (category !== 'all') {
            filtered = filtered.filter(s => s.category === category);
        }
        if (searchQuery) {
            filtered = filtered.filter(s => s.name.toLowerCase().includes(searchQuery.toLowerCase()) || s.area.toLowerCase().includes(searchQuery.toLowerCase()));
        }
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

    const handleBooking = () => {
        if (!user) {
            setActiveModal('auth');
            showToast('Please login to book a service');
            return;
        }
        if (activeService) {
            setBookings([...bookings, { ...activeService, date: new Date().toLocaleDateString() }]);
            showToast('Booking Confirmed Successfully!');
            setActiveModal(null);
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
                setUser(data);
                showToast(`${authMode === 'login' ? 'Logged in' : 'Signed up'} successfully!`);
                setActiveModal(null);
            } else {
                showToast(data.error || 'Authentication failed');
            }
        } catch (err) {
            showToast('Network error');
        }
    };

    const categories = ['all', 'Hotel', 'Electrician', 'Plumber', 'Tutors', 'Food', 'Health', 'Salon', 'Mechanic', 'Cleaning', 'Photography', 'Event', 'Interior', 'Pet', 'IT'];
    const categoryEmojis = { Hotel: '🏨', Electrician: '⚡', Plumber: '🔧', Tutors: '📚', Food: '🍕', Health: '🏥', Salon: '✂️', Mechanic: '🛠️', Cleaning: '🧹', Photography: '📷', Event: '🎉', Interior: '🏠', Pet: '🐾', IT: '💻' };

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

                    <button onClick={() => setActiveModal('bookings')} className="bg-white/10 hover:bg-white/20 text-white p-2.5 rounded-full transition-all relative" title="My Bookings">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path></svg>
                        {bookings.length > 0 && <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-cta rounded-full"></span>}
                    </button>

                    {!user ? (
                        <div id="auth-buttons" className="flex items-center space-x-4">
                            <button onClick={() => { setActiveModal('auth'); setAuthMode('login'); }} className="text-white hover:text-cta transition-colors font-black text-xs uppercase tracking-widest">Login</button>
                            <button onClick={() => { setActiveModal('auth'); setAuthMode('signup'); }} className="bg-cta text-primary px-6 py-2.5 rounded-full font-black text-xs uppercase tracking-widest hover:bg-white hover:text-primary transition-all shadow-lg">Sign Up</button>
                        </div>
                    ) : (
                        <div className="flex items-center space-x-4">
                            <div className="flex flex-col items-end">
                                <span className="text-sm font-black text-white leading-none">{user.name}</span>
                                <span className="text-[10px] font-bold text-cta uppercase tracking-widest mt-1">{user.role}</span>
                            </div>
                            <button onClick={() => { setUser(null); localStorage.removeItem('token'); }} className="bg-white/10 hover:bg-white/20 text-white p-2.5 rounded-full transition-all">
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
                        filteredServices.map(service => (
                            <div key={service.id} className="flex flex-col md:flex-row bg-white dark:bg-white/5 p-4 rounded-[32px] gap-6 card-glow border border-gray-100 dark:border-white/10 items-center animate-fade-in-up">
                                <img src={service.image} className="w-full md:w-64 h-48 md:h-full object-cover rounded-3xl" alt={service.name} />
                                <div className="flex-1 w-full space-y-4">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h3 className="text-2xl font-black text-primary dark:text-white uppercase tracking-tighter">{service.name}</h3>
                                            <p className="text-gray-500 font-medium text-sm">{service.area}</p>
                                        </div>
                                        <span className="bg-cta/10 text-cta font-black px-3 py-1 rounded-xl text-sm">₹{service.amount}</span>
                                    </div>
                                    <p className="text-gray-600 dark:text-gray-400 font-medium text-sm line-clamp-2">{service.description}</p>
                                    <div className="flex flex-wrap gap-4 items-center">
                                        <button onClick={() => { setActiveService(service); setActiveModal('detail'); }} className="bg-primary text-bg-dark hover:bg-highlight px-6 py-3 rounded-2xl font-black text-xs uppercase transition-all shadow-md">View Details</button>
                                        <span className="flex items-center text-cta font-black text-sm"><svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path></svg> {service.rating}</span>
                                    </div>
                                </div>
                            </div>
                        ))
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
                    <div className="modal-overlay absolute inset-0 bg-black/50" onClick={() => setActiveModal(null)}></div>
                    <div className="bg-bg-dark border border-white/10 w-full max-w-lg rounded-[40px] relative z-10 p-12 shadow-2xl modal-enter">
                        <h2 className="text-5xl font-black mb-2 text-white uppercase tracking-tighter leading-none">{authMode === 'login' ? 'Welcome Back' : 'Join Elite'}</h2>
                        <div className="flex gap-4 mb-8 mt-6 bg-white/5 p-1.5 rounded-2xl">
                            <button type="button" onClick={() => setAuthRole('user')} className={`flex-1 py-3.5 rounded-xl font-black text-xs uppercase transition-all ${authRole === 'user' ? 'bg-cta text-primary' : 'text-gray-500'}`}>User</button>
                            <button type="button" onClick={() => setAuthRole('worker')} className={`flex-1 py-3.5 rounded-xl font-black text-xs uppercase transition-all ${authRole === 'worker' ? 'bg-cta text-primary' : 'text-gray-500'}`}>Provider</button>
                        </div>
                        <form onSubmit={handleAuthSubmit} className="space-y-6">
                            {authMode === 'signup' && (
                                <div>
                                    <label className="block text-[10px] font-black text-gray-500 mb-2 uppercase tracking-[0.2em]">Full Name</label>
                                    <input name="name" required type="text" className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 focus:border-primary outline-none transition-all text-white font-medium" />
                                </div>
                            )}
                            {authMode === 'signup' && authRole === 'worker' && (
                                <div className="space-y-6">
                                    <div className="grid grid-cols-2 gap-4">
                                        <input name="bizName" required placeholder="Business Name" className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white text-sm" />
                                        <input name="bizCategory" required placeholder="Category" className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white text-sm" />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <input name="bizArea" required placeholder="Area" className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white text-sm" />
                                        <input name="bizImage" required placeholder="Image URL" className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white text-sm" />
                                    </div>
                                </div>
                            )}
                            <div>
                                <label className="block text-[10px] font-black text-gray-500 mb-2 uppercase tracking-[0.2em]">Email</label>
                                <input name="email" required type="email" className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 focus:border-primary outline-none transition-all text-white font-medium" />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-gray-500 mb-2 uppercase tracking-[0.2em]">Password</label>
                                <input name="password" required type="password" className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 focus:border-primary outline-none transition-all text-white font-medium" />
                            </div>
                            <button type="submit" className="w-full bg-primary text-bg-dark font-black py-5 rounded-2xl hover:bg-white transition-all uppercase tracking-[0.2em] text-xs">Continue</button>
                        </form>
                        <p className="mt-10 text-xs font-black text-gray-500 text-center uppercase tracking-widest">
                            <span className="cursor-pointer text-primary hover:text-white" onClick={() => setAuthMode(authMode === 'login' ? 'signup' : 'login')}>{authMode === 'login' ? 'Create an account' : 'Already have an account?'}</span>
                        </p>
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
                                    <div className="text-cta font-black">₹{b.amount}</div>
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
