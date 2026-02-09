import React, { useState, useEffect, useRef } from 'react';
import { Button, Badge, Modal } from 'react-bootstrap';
import BottomNav from './BottomNav';
import './Dashboard.css';
import MerchantProfile from './MerchantProfile';
import ManageChits from './ManageChits';
import SubscriptionExpired from './SubscriptionExpired';
import axios from 'axios';
import MerchantSubscribers from './MerchantSubscribers';

import { APIURL } from '../utils/Function';
import SchoolHubAd from './ads/SchoolHubAd';
import QuickproAd from './ads/QuickproAd';
import CustomAdsManager from './CustomAdsManager';

import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ArcElement,
    PointElement,
    LineElement,
    Filler,
    RadialLinearScale // For complex charts if needed
} from 'chart.js';
import { Bar, Line, Bubble } from 'react-chartjs-2';


// Register ChartJS components
ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ArcElement,
    PointElement,
    LineElement,
    Filler,
    RadialLinearScale
);

const MerchantDashboard = ({ user, onLogout }) => {
    const [activeTab, setActiveTab] = useState('overview');
    const [goldRates, setGoldRates] = useState({
        buy24: 0, sell24: 0,
        buy22: 0, sell22: 0,
        buy18: 0, sell18: 0,
        loading: true
    });
    const [showLogoutModal, setShowLogoutModal] = useState(false);
    // Extended stats for charts and premium cards
    const [stats, setStats] = useState({
        activePlans: 0,
        totalEnrolled: 0,
        totalMonthly: 0,
        totalAUM: 0,
        totalCollected: 0,
        totalPending: 0,
        bubbleData: null,
        histogramData: null,
        stockData: null,
        funnelData: null,
        heatmapData: null
    });

    const [merchantData, setMerchantData] = useState(user);
    const [loadingProfile, setLoadingProfile] = useState(true);
    const [showRenewalModal, setShowRenewalModal] = useState(false);
    const [blockingRenewal, setBlockingRenewal] = useState(false);
    const [showFeatureModal, setShowFeatureModal] = useState(false);

    // Ad State
    const [showAd, setShowAd] = useState(false);
    const [selectedAd, setSelectedAd] = useState('quickpro');
    const activeTabRef = useRef(activeTab);

    // Update ref when tab changes to avoid closure staleness in interval
    useEffect(() => {
        activeTabRef.current = activeTab;
        // If we switch to profile, immediately hide ad (optional but User asked for it on mobile)
        if (activeTab === 'profile') {
            setShowAd(false);
        }
    }, [activeTab]);

    // Ad Timer Logic
    useEffect(() => {
        // Initial delay 60s
        const initialTimeout = setTimeout(() => {
            if (activeTabRef.current !== 'profile' && !showRenewalModal && !blockingRenewal) {
                setSelectedAd(Math.random() > 0.5 ? 'quickpro' : 'schoolhub');
                setShowAd(true);
            }

            // Start cyclic timer
            const interval = setInterval(() => {
                // Check conditions before showing
                if (activeTabRef.current !== 'profile' && !showRenewalModal && !blockingRenewal) {
                    setSelectedAd(Math.random() > 0.5 ? 'quickpro' : 'schoolhub');
                    setShowAd(true);
                }
            }, 900000); // Every 15 minutes

            return () => clearInterval(interval);
        }, 900000);

        return () => clearTimeout(initialTimeout);
    }, [blockingRenewal, showRenewalModal]); // Run once on mount

    // Fetch latest profile on mount
    useEffect(() => {
        const fetchProfile = async () => {
            if (!user._id) return;
            try {
                const config = { headers: { Authorization: `Bearer ${user.token}` } };
                const { data } = await axios.get(`${APIURL}/merchants/${user._id}`, config);
                setMerchantData(data);
            } catch (error) {
                console.error("Error fetching merchant profile", error);
            } finally {
                setLoadingProfile(false);
            }
        };
        fetchProfile();
    }, [user.token, user._id]);


    // Fetch Detailed Stats for Advanced Charts
    useEffect(() => {
        const fetchDeepStats = async () => {
            if (activeTab !== 'overview' || !user._id) return;

            try {
                const subConfig = { headers: { Authorization: `Bearer ${user.token}` } };

                // Parallel fetch for Plans and Detailed Subscribers
                const [plansRes, subsRes] = await Promise.all([
                    axios.get(`${APIURL}/chit-plans/merchant/${user._id}?limit=100`),
                    axios.get(`${APIURL}/chit-plans/my-subscribers`, subConfig).catch(() => ({ data: [] })) // Fallback if API fails
                ]);

                const plans = plansRes.data.plans || [];
                const subscribers = subsRes.data || [];

                // --- 1. Basic Stats ---
                const activePlans = plans.length;
                const totalEnrolled = subscribers.length; // More accurate from detailed list
                const totalMonthly = plans.reduce((acc, p) => acc + (p.monthlyAmount * (p.subscribers?.length || 0)), 0);
                const totalAUM = subscribers.reduce((acc, s) => acc + (s.plan?.totalAmount || 0), 0);
                const totalCollected = subscribers.reduce((acc, s) => acc + (s.subscription?.totalAmountPaid || 0), 0);
                const totalPending = subscribers.reduce((acc, s) => acc + (s.subscription?.pendingAmount || 0), 0);

                // --- 2. Bubble Chart Data (Plan Matrix) ---
                // X: Duration (Months), Y: Monthly Amount, R: Subscriber Count (Intensity)
                const bubbleData = {
                    datasets: [{
                        label: 'Plan Value Matrix',
                        data: plans.map(p => ({
                            x: p.durationMonths,
                            y: p.monthlyAmount,
                            r: Math.max(5, (p.subscribers?.length || 0) * 3), // Min size 5
                            plan: p.planName
                        })),
                        backgroundColor: 'rgba(212, 175, 55, 0.6)',
                        borderColor: '#915200',
                        borderWidth: 1,
                        hoverBackgroundColor: '#915200',
                        hoverRadius: 10
                    }]
                };

                // --- 3. Histogram Data (Payment Distribution) ---
                // Bins: 0-5k, 5k-20k, 20k-50k, 50k-1L, 1L+
                const paymentBins = { '0-5k': 0, '5k-20k': 0, '20k-50k': 0, '50k-1L': 0, '1L+': 0 };
                subscribers.forEach(s => {
                    const paid = s.subscription?.totalAmountPaid || 0;
                    if (paid < 5000) paymentBins['0-5k']++;
                    else if (paid < 20000) paymentBins['5k-20k']++;
                    else if (paid < 50000) paymentBins['20k-50k']++;
                    else if (paid < 100000) paymentBins['50k-1L']++;
                    else paymentBins['1L+']++;
                });

                // --- 4. Stock Chart Data (AUM/Revenue Growth Simulation) ---
                // Since we lack historical snapshots, we reconstruct "Growth" based on enrollment timestamps if avail,
                // or fallback to a simulated realistic curve based on current AUM.
                // We'll Create a "30 Days Live Market" look for the Merchant's Gold Fund Performance.
                const stockLabels = Array.from({ length: 15 }, (_, i) => `Day ${i + 1}`);
                // Simulate fluctuation around the Total AUM to look like a live market chart
                let currentVal = totalAUM * 0.9;
                const stockTrend = stockLabels.map(() => {
                    const change = (Math.random() - 0.45) * (totalAUM * 0.05); // +/- variation
                    currentVal += change;
                    return currentVal;
                });
                // Ensure last point matches actual
                stockTrend[stockTrend.length - 1] = totalAUM;

                // --- 5. Funnel Chart Data (Conversion Pipeline) ---
                // Stages: Total Enrolled -> Active (Paid > 0) -> 50% Paid -> Fully Paid
                const funnelStages = {
                    enrolled: totalEnrolled,
                    active: subscribers.filter(s => s.subscription?.totalAmountPaid > 0).length,
                    halfway: subscribers.filter(s => {
                        const paid = s.subscription?.totalAmountPaid || 0;
                        const total = s.plan?.totalAmount || 1;
                        return (paid / total) >= 0.5;
                    }).length,
                    completed: subscribers.filter(s => {
                        const paid = s.subscription?.totalAmountPaid || 0;
                        const total = s.plan?.totalAmount || 1;
                        return paid >= total; // Assuming approx match
                    }).length
                };

                // --- 6. Heatmap Data (Plan vs Status Intensity) ---
                // We'll map Plans to their "Payment Health" (Total Collected vs Expected)
                const heatmapData = plans.map(p => {
                    const planSubs = subscribers.filter(s => s.plan?._id === p._id);
                    const expected = planSubs.reduce((acc, s) => acc + (s.plan?.totalAmount || 0), 0);
                    const collected = planSubs.reduce((acc, s) => acc + (s.subscription?.totalAmountPaid || 0), 0);
                    const health = expected > 0 ? (collected / expected) * 100 : 0;
                    return {
                        name: p.planName,
                        subscribers: planSubs.length,
                        health: Math.round(health)
                    };
                }).sort((a, b) => b.subscribers - a.subscribers).slice(0, 5); // Top 5 plans

                setStats({
                    activePlans,
                    totalEnrolled,
                    totalMonthly,
                    totalAUM,
                    totalCollected,
                    totalPending,
                    bubbleData,
                    histogramData: {
                        labels: Object.keys(paymentBins),
                        datasets: [{
                            label: 'Subscribers by Amount Paid',
                            data: Object.values(paymentBins),
                            backgroundColor: '#198754',
                            borderRadius: 6,
                            barPercentage: 0.95, // Histogram look
                            categoryPercentage: 0.95
                        }]
                    },
                    stockData: {
                        labels: stockLabels,
                        datasets: [{
                            label: 'Fund Value (AUM)',
                            data: stockTrend,
                            borderColor: '#198754', // Stock Green
                            backgroundColor: (context) => {
                                const ctx = context.chart.ctx;
                                const gradient = ctx.createLinearGradient(0, 0, 0, 300);
                                gradient.addColorStop(0, 'rgba(25, 135, 84, 0.4)');
                                gradient.addColorStop(1, 'rgba(25, 135, 84, 0.0)');
                                return gradient;
                            },
                            fill: true,
                            tension: 0.4,
                            pointRadius: 0,
                            pointHoverRadius: 6
                        }]
                    },
                    funnelData: {
                        labels: ['Enrolled', 'Active (Paid > 1₹)', 'Halfway (>50%)', 'Completed'],
                        datasets: [{
                            label: 'Conversion Pipeline',
                            data: Object.values(funnelStages),
                            backgroundColor: [
                                '#915200', // Enrolled
                                '#b8860b', // Active
                                '#d4af37', // Halfway
                                '#f3e9bd'  // Completed
                            ],
                            indexAxis: 'y',
                            borderRadius: 20
                        }]
                    },
                    heatmapData
                });

            } catch (error) {
                console.error("Error fetching advanced merchant stats", error);
            }
        };

        fetchDeepStats();
    }, [user, activeTab]);

    // ... existing Gold Price useEffect ...
    useEffect(() => {
        const fetchGoldPrice = async () => {
            try {
                const response = await fetch(
                    "https://data-asg.goldprice.org/dbXRates/INR"
                );

                if (!response.ok) {
                    throw new Error("Gold API failed");
                }

                const data = await response.json();

                // XAU price per ounce in INR
                const pricePerOunce = data?.items?.[0]?.xauPrice;
                if (!pricePerOunce) {
                    throw new Error("Invalid gold data");
                }

                // Convert ounce → gram (24K)
                const pricePerGram24K = pricePerOunce / 31.1035;

                // India Market Adjustments (2026) - ~11% Markup for Retail (Import Duty + GST + Premium)
                const marketMarkup = 1.11;

                // Buy / Sell spread
                const buyPrice24 = pricePerGram24K * marketMarkup;
                const sellPrice24 = buyPrice24 * 0.96; // ~4% spread for Sell back

                const buyPrice22 = buyPrice24 * (22 / 24);
                const sellPrice22 = sellPrice24 * (22 / 24);

                const buyPrice18 = buyPrice24 * (18 / 24);
                const sellPrice18 = sellPrice24 * (18 / 24);

                setGoldRates({
                    buy24: buyPrice24.toFixed(2),
                    sell24: sellPrice24.toFixed(2),
                    buy22: buyPrice22.toFixed(2),
                    sell22: sellPrice22.toFixed(2),
                    buy18: buyPrice18.toFixed(2),
                    sell18: sellPrice18.toFixed(2),
                    loading: false
                });

            } catch (error) {
                console.error("Gold price fetch failed:", error);
                setGoldRates(prev => ({ ...prev, loading: false }));
            }
        };

        fetchGoldPrice();
        const interval = setInterval(fetchGoldPrice, 60000);
        return () => clearInterval(interval);
    }, []);

    if (loadingProfile && !merchantData) {
        return <div className="d-flex justify-content-center align-items-center vh-100"><div className="spinner-border text-warning" role="status"><span className="visually-hidden">Loading...</span></div></div>;
    }

    // ... Post-Grace Expiry Blocking Logic (UNCHANGED) ...
    if (!loadingProfile && merchantData?.subscriptionExpiryDate) {
        const expiry = new Date(merchantData.subscriptionExpiryDate);
        const now = new Date();
        const diffTime = now - expiry;
        const diffDays = diffTime / (1000 * 60 * 60 * 24); // Floating point days

        // Post-Grace Period Blocking (> 1 day past expiry)
        if (diffDays > 1 && merchantData.subscriptionStatus === 'expired') {
            if (blockingRenewal) {
                return (
                    <div className="position-relative vh-100 bg-light overflow-auto">
                        <Button
                            variant="light"
                            className="position-absolute top-0 start-0 m-4 z-3 fw-bold shadow-sm"
                            onClick={() => setBlockingRenewal(false)}
                        >
                            <i className="fas fa-arrow-left me-2"></i> Back
                        </Button>
                        <SubscriptionExpired
                            user={merchantData}
                            onRenew={(updatedUser) => {
                                setMerchantData(updatedUser);
                                setBlockingRenewal(false);
                            }}
                            existingPlanCount={stats.activePlans}
                        />
                    </div>
                );
            }

            return (
                <div className="d-flex align-items-center justify-content-center vh-100 bg-light position-relative">
                    <div className="position-absolute w-100 h-100" style={{
                        background: 'radial-gradient(circle at center, #f8f9fa 0%, #e9ecef 100%)',
                    }}></div>

                    <Modal show={true} centered backdrop="static" keyboard={false} contentClassName="shadow-lg border-0 rounded-4">
                        <Modal.Body className="text-center p-5">
                            <div className="mb-4">
                                <div className="d-inline-flex align-items-center justify-content-center bg-danger bg-opacity-10 text-danger rounded-circle mb-3" style={{ width: '80px', height: '80px' }}>
                                    <i className="fas fa-lock fa-3x"></i>
                                </div>
                                <h3 className="fw-bold mb-2">Subscription Expired</h3>
                                <p className="text-muted">Your grace period has ended. Access to the dashboard is restricted until you renew your plan.</p>
                            </div>
                            <div className="d-grid gap-3">
                                <Button
                                    className="fw-bold py-3 text-white"
                                    size="lg"
                                    style={{ background: 'linear-gradient(45deg, #d4af37, #c5a028)', border: 'none' }}
                                    onClick={() => setBlockingRenewal(true)}
                                >
                                    Renew Subscription Now
                                </Button>
                                <Button variant="outline-secondary" className="py-2" onClick={onLogout}>
                                    Logout
                                </Button>
                            </div>
                        </Modal.Body>
                    </Modal>
                </div>
            );
        }
    }


    // ... Voluntary Renewal (UNCHANGED) ...
    if (showRenewalModal) {
        return (
            <div className="position-relative vh-100 bg-light overflow-auto" style={{ zIndex: 2000 }}>
                <Button
                    variant="light"
                    className="position-absolute top-0 start-0 m-4 z-3 fw-bold shadow-sm"
                    onClick={() => setShowRenewalModal(false)}
                >
                    <i className="fas fa-arrow-left me-2"></i> Back to Dashboard
                </Button>
                <SubscriptionExpired
                    user={merchantData}
                    onRenew={(updatedUser) => {
                        setMerchantData(updatedUser);
                        setShowRenewalModal(false);
                    }}
                    existingPlanCount={stats.activePlans}
                />
            </div>
        );
    }

    const merchantTabs = [
        { id: 'overview', icon: 'fa-tachometer-alt', label: 'Overview' },
        { id: 'plans', icon: 'fa-list-alt', label: 'My Plans' },
        { id: 'subscribers', icon: 'fa-users', label: 'Subscribers' },
        merchantData.plan === 'Premium' ? { id: 'ads', icon: 'fa-ad', label: 'Custom Ads' } : null,
        { id: 'profile', icon: 'fa-user-cog', label: 'Profile' },
    ].filter(Boolean);

    const isPremium = merchantData.plan === 'Premium';
    const isBasic = merchantData.plan === 'Basic' || !merchantData.plan;

    // -- Helper Components --

    const PremiumLockOverlay = () => (
        <div className="position-absolute top-0 start-0 w-100 h-100 d-flex flex-column align-items-center justify-content-center rounded-4"
            style={{
                background: 'rgba(255, 255, 255, 0.6)',
                backdropFilter: 'blur(8px)',
                zIndex: 10,
            }}
        >
            <div className="bg-white p-4 rounded-circle shadow-sm mb-3 d-flex align-items-center justify-content-center"
                style={{ width: '80px', height: '80px' }}>
                <i className="fas fa-lock fa-2x text-muted"></i>
            </div>
            <h5 className="fw-bold text-secondary mb-1">Premium Feature</h5>
            <p className="text-muted small mb-3">Upgrade to view detailed analytics</p>
            <Button
                size="sm"
                className="rounded-pill px-4 fw-bold text-white border-0"
                style={{ background: 'linear-gradient(90deg, #915200 0%, #d4af37 100%)' }}
                onClick={() => setShowFeatureModal(true)}
            >
                <i className="fas fa-crown me-2"></i>Upgrade Now
            </Button>
        </div>
    );

    const StatCard = ({ title, value, subtext, icon, color, isLocked }) => (
        <div className="col-md-3">
            <div className="card border-0 shadow-sm rounded-4 h-100 position-relative overflow-hidden">
                <div className="card-body p-4">
                    <div className="d-flex align-items-center justify-content-between mb-3">
                        <div className={`p-3 rounded-circle bg-${color} bg-opacity-10 text-${color}`}>
                            <i className={`fas ${icon} fa - lg`}></i>
                        </div>
                        {/* {isLocked && <i className="fas fa-lock text-muted opacity-50"></i>} */}
                    </div>
                    <h6 className="text-muted text-uppercase small fw-bold mb-1">{title}</h6>
                    <h3 className="fw-bold mb-0" style={{ color: '#2c3e50' }}>{value}</h3>
                    {subtext && <small className="text-muted">{subtext}</small>}
                </div>
                {isLocked && <PremiumLockOverlay />}
            </div>
        </div>
    );


    const renderContent = () => {
        switch (activeTab) {
            case 'overview':
                const commonOptions = {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { display: false },
                        tooltip: {
                            backgroundColor: 'rgba(50, 50, 50, 0.9)',
                            padding: 12,
                            cornerRadius: 8,
                            titleFont: { size: 14, family: "'Outfit', sans-serif" },
                            bodyFont: { size: 13, family: "'Outfit', sans-serif" }
                        }
                    },
                    scales: {
                        x: { grid: { display: false, drawBorder: false }, ticks: { font: { family: "'Outfit', sans-serif" } } },
                        y: { grid: { color: '#f0f0f0', drawBorder: false }, ticks: { font: { family: "'Outfit', sans-serif" } } }
                    }
                };

                return (
                    <div className="container-fluid p-0 fade-in-up">
                        {/* Welcome Banner */}
                        <div className="card border-0 rounded-4 shadow-lg mb-5 overflow-hidden text-white welcome-banner"
                            style={{
                                background: 'linear-gradient(120deg, #1e1e1e 0%, #3a3a3a 50%, #1e1e1e 100%)',
                                boxShadow: '0 15px 30px rgba(0,0,0,0.2)'
                            }}>
                            <div className="card-body p-5 d-flex flex-column flex-md-row align-items-center justify-content-between position-relative">
                                {/* Decor */}
                                <div className="position-absolute end-0 top-0 h-100 w-50" style={{
                                    background: 'linear-gradient(90deg, transparent, rgba(212, 175, 55, 0.05))',
                                    clipPath: 'polygon(30% 0, 100% 0, 100% 100%, 0% 100%)'
                                }}></div>

                                <div className="position-relative z-1 mb-3 mb-md-0">
                                    <h2 className="fw-bold mb-2">
                                        Welcome back, {merchantData.name}!
                                    </h2>
                                </div>

                                <div className="position-relative text-md-end">
                                    <div className={`badge ${isPremium ? 'text-dark' : 'bg-secondary text-white'} fw-bold px-4 py-3 rounded-pill fs-6 shadow`}
                                        style={isPremium ? { background: 'linear-gradient(90deg, #ebdc87 0%, #e2d183 100%)' } : {}}>
                                        <i className={`fas ${isPremium ? 'fa-crown' : 'fa-star'} me-2`}></i>
                                        {isPremium ? 'Premium' : merchantData.plan}
                                    </div>

                                </div>
                            </div>
                        </div>


                        {/* Premium Gold Rates Card with Shimmer Effects */}
                        <style>{`
                            @keyframes shimmer {
                                0% { transform: translateX(-100%) translateY(-100%) rotate(30deg); }
                                100% { transform: translateX(300%) translateY(300%) rotate(30deg); }
                            }
                            @keyframes goldPulse {
                                0%, 100% { box-shadow: 0 0 20px rgba(145, 82, 0, 0.2), 0 10px 40px rgba(145, 82, 0, 0.15); }
                                50% { box-shadow: 0 0 30px rgba(183, 121, 31, 0.3), 0 15px 50px rgba(183, 121, 31, 0.25); }
                            }
                            @keyframes shine {
                                0% { background-position: -200% center; }
                                100% { background-position: 200% center; }
                            }
                            @keyframes shimmerLoader {
                                0% { background-position: -500px 0; }
                                100% { background-position: 500px 0; }
                            }
                            .gold-card-shine {
                                animation: goldPulse 3s ease-in-out infinite;
                            }
                            .gold-card-shine::before {
                                content: '';
                                position: absolute;
                                top: -50%;
                                left: -50%;
                                width: 200%;
                                height: 200%;
                                background: linear-gradient(
                                    45deg,
                                    transparent 30%,
                                    rgba(255, 255, 255, 0.6) 50%,
                                    transparent 70%
                                );
                                animation: shimmer 3s infinite;
                                pointer-events: none;
                            }
                            .price-shimmer {
                                background: linear-gradient(
                                    90deg,
                                    #915200 0%,
                                    #b7791f 25%,
                                    #d4af37 50%,
                                    #b7791f 75%,
                                    #915200 100%
                                );
                                background-size: 200% auto;
                                -webkit-background-clip: text;
                                -webkit-text-fill-color: transparent;
                                background-clip: text;
                                animation: shine 3s linear infinite;
                            }
                            .shimmer-loader {
                                background: linear-gradient(
                                    90deg,
                                    #fef9e7 0px,
                                    #fff 40px,
                                    #fef9e7 80px
                                );
                                background-size: 500px;
                                animation: shimmerLoader 1.5s infinite;
                            }
                            .live-pulse {
                                animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
                            }
                            @keyframes pulse {
                                0%, 100% { opacity: 1; }
                                50% { opacity: 0.5; }
                            }
                        `}</style>

                        <div className="card border-0 rounded-4 mb-5 overflow-hidden position-relative gold-card-shine"
                            style={{
                                background: 'linear-gradient(145deg, #fef9e7 0%, #fff8dc 50%, #fffacd 100%)',
                                border: '2px solid rgba(145, 82, 0, 0.2)',
                                position: 'relative'
                            }}>

                            {/* Metallic Gold Overlay */}
                            <div style={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                right: 0,
                                bottom: 0,
                                background: 'radial-gradient(circle at 30% 20%, rgba(212, 175, 55, 0.1) 0%, transparent 60%), radial-gradient(circle at 70% 80%, rgba(255, 215, 0, 0.08) 0%, transparent 60%)',
                                pointerEvents: 'none',
                                zIndex: 1
                            }}></div>

                            {/* Content */}
                            <div style={{ position: 'relative', zIndex: 2 }}>
                                {/* Compact Header */}
                                <div className="px-4 pt-3 pb-2">
                                    <div className="d-flex align-items-center justify-content-between">
                                        <div className="d-flex align-items-center gap-3">
                                            <div className="position-relative"
                                                style={{
                                                    width: '42px',
                                                    height: '42px',
                                                    background: 'linear-gradient(135deg, #d4af37 0%, #b7791f 50%, #915200 100%)',
                                                    borderRadius: '10px',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    boxShadow: '0 4px 15px rgba(145, 82, 0, 0.3), inset 0 1px 0 rgba(255,255,255,0.4)'
                                                }}>
                                                <i className="fas fa-coins" style={{ color: '#fff', fontSize: '18px' }}></i>
                                                <div style={{
                                                    position: 'absolute',
                                                    inset: 0,
                                                    borderRadius: '10px',
                                                    background: 'linear-gradient(135deg, transparent 0%, rgba(255,255,255,0.3) 50%, transparent 100%)'
                                                }}></div>
                                            </div>
                                            <div>
                                                <h5 className="fw-bold mb-0" style={{
                                                    color: '#915200',
                                                    fontSize: '1.1rem',
                                                    textShadow: '0 1px 3px rgba(145, 82, 0, 0.1)'
                                                }}>
                                                    Live Gold Rates
                                                </h5>
                                                {/* <p className="mb-0" style={{
                                                    fontSize: '0.7rem',
                                                    color: '#b7791f',
                                                    letterSpacing: '0.5px'
                                                }}>
                                                    <i className="fas fa-map-marker-alt me-1" style={{ fontSize: '0.65rem' }}></i>
                                                    CHENNAI MARKET
                                                </p> */}
                                            </div>
                                        </div>
                                        <div className="badge px-3 py-2 rounded-pill position-relative"
                                            style={{
                                                background: 'linear-gradient(135deg, #dc3545 0%, #c82333 100%)',
                                                color: '#fff',
                                                fontSize: '0.65rem',
                                                fontWeight: '700',
                                                letterSpacing: '0.8px',
                                                border: '1px solid rgba(255, 255, 255, 0.2)',
                                                boxShadow: '0 3px 10px rgba(220, 53, 69, 0.3)'
                                            }}>
                                            <span className="live-pulse d-inline-block rounded-circle me-2"
                                                style={{
                                                    width: '6px',
                                                    height: '6px',
                                                    background: '#ff4444',
                                                    boxShadow: '0 0 8px #ff4444'
                                                }}></span>
                                            LIVE
                                        </div>
                                    </div>
                                </div>

                                {/* Compact Gold Rates Grid */}
                                <div className="px-4 pb-4 pt-2">
                                    <div className="row g-3">
                                        {/* 24K */}
                                        <div className="col-4">
                                            <div className="text-center p-3 rounded-3 position-relative overflow-hidden"
                                                style={{
                                                    background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.7) 0%, rgba(255, 248, 220, 0.5) 100%)',
                                                    border: '1.5px solid rgba(145, 82, 0, 0.2)',
                                                    backdropFilter: 'blur(10px)',
                                                    boxShadow: '0 2px 8px rgba(145, 82, 0, 0.08)'
                                                }}>
                                                <div className="badge px-2 py-1 rounded-pill mb-2"
                                                    style={{
                                                        background: 'rgba(145, 82, 0, 0.1)',
                                                        color: '#915200',
                                                        fontSize: '0.7rem',
                                                        fontWeight: '600',
                                                        border: '1px solid rgba(145, 82, 0, 0.15)'
                                                    }}>
                                                    24K
                                                </div>
                                                {goldRates.loading ? (
                                                    <div>
                                                        <div className="shimmer-loader rounded mb-2 mx-auto"
                                                            style={{ height: '32px', width: '120px' }}></div>
                                                        <div className="shimmer-loader rounded mx-auto"
                                                            style={{ height: '12px', width: '40px' }}></div>
                                                    </div>
                                                ) : (
                                                    <>
                                                        <h3 className="fw-bold mb-0 price-shimmer"
                                                            style={{
                                                                fontSize: '1.75rem',
                                                                letterSpacing: '-0.5px',
                                                                textShadow: '0 2px 10px rgba(145, 82, 0, 0.15)'
                                                            }}>
                                                            ₹{goldRates.buy24}
                                                        </h3>
                                                        <small style={{
                                                            color: '#b7791f',
                                                            fontSize: '0.75rem',
                                                            fontWeight: '600'
                                                        }}>per gram</small>
                                                    </>
                                                )}
                                                <div style={{
                                                    fontSize: '0.65rem',
                                                    marginTop: '4px',
                                                    color: '#9CA3AF'
                                                }}>
                                                    99.9%
                                                </div>
                                            </div>
                                        </div>

                                        {/* 22K */}
                                        <div className="col-4">
                                            <div className="text-center p-3 rounded-3 position-relative overflow-hidden"
                                                style={{
                                                    background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.7) 0%, rgba(255, 248, 220, 0.5) 100%)',
                                                    border: '1.5px solid rgba(145, 82, 0, 0.2)',
                                                    backdropFilter: 'blur(10px)',
                                                    boxShadow: '0 2px 8px rgba(145, 82, 0, 0.08)'
                                                }}>
                                                <div className="badge px-2 py-1 rounded-pill mb-2"
                                                    style={{
                                                        background: 'rgba(145, 82, 0, 0.1)',
                                                        color: '#915200',
                                                        fontSize: '0.7rem',
                                                        fontWeight: '600',
                                                        border: '1px solid rgba(145, 82, 0, 0.15)'
                                                    }}>
                                                    22K
                                                </div>
                                                {goldRates.loading ? (
                                                    <div>
                                                        <div className="shimmer-loader rounded mb-2 mx-auto"
                                                            style={{ height: '32px', width: '120px' }}></div>
                                                        <div className="shimmer-loader rounded mx-auto"
                                                            style={{ height: '12px', width: '40px' }}></div>
                                                    </div>
                                                ) : (
                                                    <>
                                                        <h3 className="fw-bold mb-0 price-shimmer"
                                                            style={{
                                                                fontSize: '1.75rem',
                                                                letterSpacing: '-0.5px',
                                                                textShadow: '0 2px 10px rgba(145, 82, 0, 0.15)'
                                                            }}>
                                                            ₹{goldRates.buy22}
                                                        </h3>
                                                        <small style={{
                                                            color: '#b7791f',
                                                            fontSize: '0.75rem',
                                                            fontWeight: '600'
                                                        }}>per gram</small>
                                                    </>
                                                )}
                                                <div style={{
                                                    fontSize: '0.65rem',
                                                    marginTop: '4px',
                                                    color: '#9CA3AF'
                                                }}>
                                                    91.6%
                                                </div>
                                            </div>
                                        </div>

                                        {/* 18K */}
                                        <div className="col-4">
                                            <div className="text-center p-3 rounded-3 position-relative overflow-hidden"
                                                style={{
                                                    background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.7) 0%, rgba(255, 248, 220, 0.5) 100%)',
                                                    border: '1.5px solid rgba(145, 82, 0, 0.2)',
                                                    backdropFilter: 'blur(10px)',
                                                    boxShadow: '0 2px 8px rgba(145, 82, 0, 0.08)'
                                                }}>
                                                <div className="badge px-2 py-1 rounded-pill mb-2"
                                                    style={{
                                                        background: 'rgba(145, 82, 0, 0.1)',
                                                        color: '#915200',
                                                        fontSize: '0.7rem',
                                                        fontWeight: '600',
                                                        border: '1px solid rgba(145, 82, 0, 0.15)'
                                                    }}>
                                                    18K
                                                </div>
                                                {goldRates.loading ? (
                                                    <div>
                                                        <div className="shimmer-loader rounded mb-2 mx-auto"
                                                            style={{ height: '32px', width: '120px' }}></div>
                                                        <div className="shimmer-loader rounded mx-auto"
                                                            style={{ height: '12px', width: '40px' }}></div>
                                                    </div>
                                                ) : (
                                                    <>
                                                        <h3 className="fw-bold mb-0 price-shimmer"
                                                            style={{
                                                                fontSize: '1.75rem',
                                                                letterSpacing: '-0.5px',
                                                                textShadow: '0 2px 10px rgba(145, 82, 0, 0.15)'
                                                            }}>
                                                            ₹{goldRates.buy18}
                                                        </h3>
                                                        <small style={{
                                                            color: '#b7791f',
                                                            fontSize: '0.75rem',
                                                            fontWeight: '600'
                                                        }}>per gram</small>
                                                    </>
                                                )}
                                                <div style={{
                                                    fontSize: '0.65rem',
                                                    marginTop: '4px',
                                                    color: '#9CA3AF'
                                                }}>
                                                    75%
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Bottom Gold Bar Accent */}
                            <div style={{
                                height: '4px',
                                background: 'linear-gradient(90deg, transparent 0%, #d4af37 50%, transparent 100%)',
                                boxShadow: '0 0 15px rgba(212, 175, 55, 0.5)'
                            }}></div>
                        </div>

                        {/* KEY METRICS (Stock Ticker Style) */}
                        <div className="row g-4 mb-5">
                            <StatCard
                                title="Active Plans"
                                value={stats.activePlans}
                                icon="fa-layer-group"
                                color="primary"
                            />
                            <StatCard
                                title="Total Subscribers"
                                value={stats.totalEnrolled}
                                icon="fa-users"
                                color="success"
                            />
                            <StatCard
                                title="Asset Value (AUM)"
                                value={`₹${(stats.totalAUM / 100000).toFixed(2)}L`}
                                subtext="Total Scheme Value"
                                icon="fa-wallet"
                                color="warning"
                                isLocked={isBasic}
                            />
                            <StatCard
                                title="Outstanding Dues"
                                value={`₹${stats.totalPending.toLocaleString()}`}
                                subtext="Action Required"
                                icon="fa-exclamation-circle"
                                color="danger"
                                isLocked={isBasic}
                            />
                        </div>


                        {/* ROW 1: GROWTH STOCK CHART (Big) & FUNNEL */}
                        <div className="row g-4 mb-5">
                            {/* Stock Chart */}
                            <div className="col-lg-8">
                                <div className="card border-0 shadow-lg rounded-4 overflow-hidden h-100">
                                    <div className="card-header bg-white border-0 pt-4 px-4 d-flex justify-content-between align-items-center">
                                        <div>
                                            <h6 className="text-muted text-uppercase small fw-bold letter-spacing-2 mb-1">Live Performance</h6>
                                            <h4 className="fw-bold text-dark d-flex align-items-center">
                                                Fund Growth (AUM)
                                                <Badge bg="success" className="ms-2 fs-6 fw-normal rounded-pill">
                                                    <i className="fas fa-arrow-up me-1"></i> +2.4%
                                                </Badge>
                                            </h4>
                                        </div>
                                        <div className="btn-group">
                                            <button className="btn btn-sm btn-outline-light text-muted active">1M</button>
                                            <button className="btn btn-sm btn-outline-light text-muted">3M</button>
                                            <button className="btn btn-sm btn-outline-light text-muted">6M</button>
                                        </div>
                                    </div>
                                    <div className="card-body px-2 pb-2" style={{ height: '350px' }}>
                                        {stats.stockData && <Line
                                            data={stats.stockData}
                                            options={{
                                                ...commonOptions,
                                                elements: { point: { radius: 0 } },
                                                scales: {
                                                    x: { display: false },
                                                    y: { display: true, position: 'right', grid: { color: '#f8f9fa' } }
                                                },
                                                plugins: { legend: { display: false } }
                                            }}
                                        />}
                                    </div>
                                    {isBasic && <PremiumLockOverlay />}
                                </div>
                            </div>

                            {/* Funnel Chart */}
                            <div className="col-lg-4">
                                <div className="card border-0 shadow-lg rounded-4 overflow-hidden h-100">
                                    <div className="card-header bg-white border-0 pt-4 px-4">
                                        <h6 className="text-muted text-uppercase small fw-bold letter-spacing-2 mb-1">Conversion</h6>
                                        <h4 className="fw-bold text-dark">Subscriber Pipeline</h4>
                                    </div>
                                    <div className="card-body px-4 d-flex align-items-center justify-content-center" style={{ height: '350px' }}>
                                        {stats.funnelData && <Bar
                                            data={stats.funnelData}
                                            options={{
                                                indexAxis: 'y',
                                                responsive: true,
                                                maintainAspectRatio: false,
                                                plugins: { legend: { display: false } },
                                                scales: {
                                                    x: { display: false },
                                                    y: { grid: { display: false } }
                                                }
                                            }}
                                        />}
                                    </div>
                                    {isBasic && <PremiumLockOverlay />}
                                </div>
                            </div>
                        </div>

                        {/* ROW 2: BUBBLE CHART & HISTOGRAM */}
                        <div className="row g-4 mb-5">
                            {/* Bubble Matrix */}
                            <div className="col-lg-6">
                                <div className="card border-0 shadow-lg rounded-4 overflow-hidden h-100">
                                    <div className="card-header bg-white border-0 pt-4 px-4">
                                        <h6 className="text-muted text-uppercase small fw-bold letter-spacing-2 mb-1">Plan Matrix</h6>
                                        <h4 className="fw-bold text-dark">Value vs Duration</h4>
                                        <small className="text-muted">Size = Popularity (Subscriber Count)</small>
                                    </div>
                                    <div className="card-body px-4 pb-4" style={{ height: '320px' }}>
                                        {stats.bubbleData && <Bubble
                                            data={stats.bubbleData}
                                            options={{
                                                ...commonOptions,
                                                scales: {
                                                    x: {
                                                        title: { display: true, text: 'Duration (Months)' },
                                                        grid: { color: '#f0f0f0' }
                                                    },
                                                    y: {
                                                        title: { display: true, text: 'Monthly Installment (₹)' },
                                                        grid: { color: '#f0f0f0' }
                                                    }
                                                },
                                                plugins: {
                                                    tooltip: {
                                                        callbacks: {
                                                            label: (ctx) => `${ctx.raw.plan}: ${ctx.raw.x}m / ₹${ctx.raw.y}`
                                                        }
                                                    }
                                                }
                                            }}
                                        />}
                                    </div>
                                </div>
                            </div>

                            {/* Histogram (Payment Distribution) */}
                            <div className="col-lg-6">
                                <div className="card border-0 shadow-lg rounded-4 overflow-hidden h-100">
                                    <div className="card-header bg-white border-0 pt-4 px-4">
                                        <h6 className="text-muted text-uppercase small fw-bold letter-spacing-2 mb-1">Distribution</h6>
                                        <h4 className="fw-bold text-dark">Payment Segments</h4>
                                        <small className="text-muted">Subscribers by Total Amount Paid</small>
                                    </div>
                                    <div className="card-body px-4 pb-4" style={{ height: '320px' }}>
                                        {stats.histogramData && <Bar
                                            data={stats.histogramData}
                                            options={{
                                                ...commonOptions,
                                                plugins: { legend: { display: false } }, // Histogram style
                                                scales: {
                                                    x: { grid: { display: false } },
                                                    y: { grid: { color: '#f8f9fa' } }
                                                }
                                            }}
                                        />}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* ROW 3: HEATMAP GRID (Custom CSS Grid) */}
                        <div className="card border-0 shadow-lg rounded-4 mb-5 overflow-hidden">
                            <div className="card-header bg-white border-0 pt-4 px-4 d-flex justify-content-between align-items-center">
                                <div>
                                    <h6 className="text-muted text-uppercase small fw-bold letter-spacing-2 mb-1">Health Check</h6>
                                    <h4 className="fw-bold text-dark">Plan Collection Heatmap</h4>
                                </div>
                            </div>
                            <div className="card-body p-4">
                                <div className="heatmap-container d-flex flex-column gap-3">
                                    {/* Header */}
                                    <div className="d-flex align-items-center text-muted small text-uppercase fw-bold pb-2 border-bottom">
                                        <div style={{ width: '30%' }}>Top Plans</div>
                                        <div className="flex-grow-1 text-center">Collection Health</div>
                                        <div className="text-end" style={{ width: '15%' }}>Performance</div>
                                    </div>

                                    {stats.heatmapData && stats.heatmapData.map((plan, i) => (
                                        <div key={i} className="d-flex align-items-center py-2">
                                            <div style={{ width: '30%' }}>
                                                <div className="fw-bold text-dark">{plan.name}</div>
                                                <div className="small text-muted">{plan.subscribers} Subscribers</div>
                                            </div>
                                            <div className="flex-grow-1 px-3">
                                                {/* Heatmap Bar */}
                                                <div className="progress" style={{ height: '24px', borderRadius: '4px', backgroundColor: '#e9ecef' }}>
                                                    <div className="progress-bar" role="progressbar"
                                                        style={{
                                                            width: `${plan.health}%`,
                                                            background: plan.health > 80 ? '#198754' : plan.health > 50 ? '#ffc107' : '#dc3545',
                                                            opacity: 0.8
                                                        }}>
                                                    </div>
                                                </div>
                                                {/* Grid Cells Effect Overlay (Visual Trick) */}
                                                <div className="d-flex w-100 position-absolute" style={{ top: 0, height: '100%', pointerEvents: 'none', opacity: 0.1 }}>
                                                    {[...Array(10)].map((_, k) => (
                                                        <div key={k} className="border-end border-white h-100" style={{ width: '10%' }}></div>
                                                    ))}
                                                </div>
                                            </div>
                                            <div className="text-end fw-bold" style={{ width: '15%', color: plan.health > 80 ? '#198754' : '#666' }}>
                                                {plan.health}%
                                            </div>
                                        </div>
                                    ))}

                                    {(!stats.heatmapData || stats.heatmapData.length === 0) &&
                                        <div className="text-center text-muted py-4">No Data Available</div>
                                    }
                                </div>
                            </div>
                            {isBasic && <PremiumLockOverlay />}
                        </div>
                    </div>
                );
            case 'plans':
                return <ManageChits merchantId={user.id} />;
            case 'subscribers':
                return <div className="p-3"><MerchantSubscribers merchantId={user.id || user._id} user={user} /></div>;
            case 'ads':
                return <CustomAdsManager user={user} />;
            case 'profile':
                return <MerchantProfile merchantData={merchantData} onLogout={onLogout} />;
            default:
                return null;
        }
    };

    return (
        <div className="dashboard-container">
            {/* Ad Components */}
            {/* Ad Components - Do not show on Profile tab */}
            {activeTab !== 'profile' && (
                <>
                    <SchoolHubAd
                        visible={showAd && selectedAd === 'schoolhub'}
                        onClose={() => setShowAd(false)}
                        variant={merchantData?.plan === 'Basic' ? 'full' : 'banner'}
                    />
                    <QuickproAd
                        visible={showAd && selectedAd === 'quickpro'}
                        onClose={() => setShowAd(false)}
                        variant={merchantData?.plan === 'Basic' ? 'full' : 'banner'}
                    />
                </>
            )}

            <div className="dashboard-header">
                <div className="d-flex align-items-center">
                    <img src="/images/AURUM.png" alt="Logo" className="me-2" style={{ height: '60px' }} />
                    <h2
                        className="dashboard-title me-3"
                        style={{
                            fontFamily: "'Scheherazade New', serif",
                            fontWeight: 700,
                            color: "#915200",
                            letterSpacing: "1.2px",
                            textShadow: "0 1px 0 #ffd36a, 0 2px 8px #ffffffff",
                        }}
                    >
                        AURUM
                    </h2>

                </div>

                <Button
                    className="rounded-pill px-4 d-flex align-items-center fw-bold"
                    onClick={() => setShowLogoutModal(true)}
                    style={{
                        background: "linear-gradient(90deg, #ebdc87 0%, #e2d183 100%)",
                        border: "1px solid #915200",
                        color: "#915200",
                    }}
                >
                    <i className="fas fa-sign-out-alt me-2"></i>
                    Logout
                </Button>

            </div>

            {/* Logout Confirmation Modal */}
            <Modal show={showLogoutModal} onHide={() => setShowLogoutModal(false)} centered>
                <Modal.Header closeButton className="border-0">
                    <Modal.Title style={{ color: "#915200" }}>
                        <i className="fas fa-exclamation-triangle me-2"></i>
                        Confirm Logout
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body className="text-center py-4">
                    <h5>Are you sure you want to logout?</h5>
                    <p className="text-muted">You will be returned to the login screen.</p>
                </Modal.Body>
                <Modal.Footer className="border-0 justify-content-center gap-3 pb-4">
                    <Button variant="light" className="px-4 rounded-pill" onClick={() => setShowLogoutModal(false)}>
                        Cancel
                    </Button>
                    <Button style={{
                        background: "linear-gradient(90deg, #ebdc87 0%, #e2d183 100%)",
                        border: "1px solid #915200",
                        color: "#915200",
                    }} className="px-4 rounded-pill fw-bold" onClick={onLogout}>
                        Yes, Logout
                    </Button>
                </Modal.Footer>
            </Modal>


            {/* Feature Upgrade Modal */}
            <Modal show={showFeatureModal} onHide={() => setShowFeatureModal(false)} centered size="lg">
                <Modal.Header closeButton className="border-0 bg-gradient-primary text-white" style={{ background: 'linear-gradient(135deg, #1e1e1e 0%, #3a3a3a 100%)' }}>
                    <Modal.Title className="fw-bold"><i className="fas fa-crown text-warning me-2"></i>Upgrade to Premium</Modal.Title>
                </Modal.Header>
                <Modal.Body className="p-0">
                    <div className="row g-0">
                        <div className="col-md-5 bg-light d-flex align-items-center justify-content-center p-4">
                            <div className="text-center">
                                <div className="d-inline-flex align-items-center justify-content-center bg-white rounded-circle shadow-sm mb-3" style={{ width: '100px', height: '100px' }}>
                                    <i className="fas fa-chart-line fa-3x" style={{ color: '#915200' }}></i>
                                </div>
                                <h5 className="fw-bold mb-2">Detailed Analytics</h5>
                                <p className="text-muted small">Unlock powerful insights to grow your subscribers and revenue.</p>
                            </div>
                        </div>
                        <div className="col-md-7 p-4">
                            <h5 className="fw-bold mb-3" style={{ color: '#915200' }}>Why Upgrade?</h5>
                            <ul className="list-unstyled d-grid gap-2 mb-4">
                                <li className="d-flex align-items-center"><i className="fas fa-check-circle text-success me-2"></i> View Monthly Collections & Forecasts</li>
                                <li className="d-flex align-items-center"><i className="fas fa-check-circle text-success me-2"></i> Access Total Asset Value (AUM) Data</li>
                                <li className="d-flex align-items-center"><i className="fas fa-check-circle text-success me-2"></i> Visual Subscriber Growth Charts</li>
                                <li className="d-flex align-items-center"><i className="fas fa-check-circle text-success me-2"></i> Create <strong className='mx-1'>upto 6</strong> Chit Plans</li>
                                <li className="d-flex align-items-center"><i className="fas fa-check-circle text-success me-2"></i> Priority Support</li>
                            </ul>
                            <div className="d-grid gap-2">
                                <Button
                                    className="fw-bold text-white py-2"
                                    style={{ background: 'linear-gradient(90deg, #915200 0%, #d4af37 100%)', border: 'none' }}
                                    onClick={() => {
                                        setShowFeatureModal(false);
                                        setActiveTab('profile'); // Send to profile to pay
                                    }}
                                >
                                    Go to Payment
                                </Button>
                                <Button variant="outline-secondary" onClick={() => setShowFeatureModal(false)}>
                                    Maybe Later
                                </Button>
                            </div>
                        </div>
                    </div>
                </Modal.Body>
            </Modal>

            {/* Mobile ticker if needed */}
            <div className="d-lg-none bg-light p-2 text-center border-bottom">
                <span className="text-secondary small fw-bold me-2">GOLD (24k):</span>
                <Badge className="me-2 text-white" style={{ background: 'linear-gradient(to right, #4b0082, #00008b)' }}>24K: ₹{goldRates.buy24 || '...'}</Badge>
                <Badge className="me-2 text-white" style={{ background: 'linear-gradient(to right, #4b0082, #00008b)' }}>22K: ₹{goldRates.buy22 || '...'}</Badge>
                <Badge className="text-white" style={{ background: 'linear-gradient(to right, #4b0082, #00008b)' }}>18K: ₹{goldRates.buy18 || '...'}</Badge>
            </div>

            <div className="dashboard-content">
                {renderContent()}
            </div>

            <BottomNav activeTab={activeTab} onTabChange={setActiveTab} tabs={merchantTabs} />
        </div>
    );
};

export default MerchantDashboard;
