import { useState, useEffect } from 'react';
import { Row, Col, Card, Table } from 'react-bootstrap';
import { Line, Doughnut, Bar } from 'react-chartjs-2';
// import { merchants } from '../data/mockData';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ArcElement
} from 'chart.js';
import axios from 'axios';
import { APIURL } from '../utils/Function';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ArcElement
);

const Subscribers = () => {
    const [merchantsList, setMerchantsList] = useState([]);
    const [stats, setStats] = useState({
        premiumCount: 0,
        standardCount: 0,
        total: 0,
        revenue: 0,
        active: 0,
        pending: 0,
        inactive: 0
    });

    useEffect(() => {
        const fetchMerchants = async () => {
            try {
                const user = JSON.parse(localStorage.getItem('user'));
                const config = {
                    headers: {
                        Authorization: `Bearer ${user?.token}`
                    }
                };
                const res = await axios.get(`${APIURL}/merchants`, config);
                const data = res.data.merchants;
                setMerchantsList(data);

                const premiumCount = data.filter(m => m.plan === 'Premium').length;
                const standardCount = data.filter(m => m.plan === 'Standard').length; // or 'Basic' or default
                // If plan is not 'Premium' or 'Standard', assume standard/free?
                // Let's assume just counted by Plan field.

                const total = data.length;
                const revenue = (premiumCount * 5000) + (standardCount * 1500); // Estimations

                setStats({
                    premiumCount,
                    standardCount,
                    total,
                    revenue,
                    active: data.filter(m => m.status === 'Approved').length,
                    pending: data.filter(m => m.status === 'Pending').length,
                    inactive: data.filter(m => m.status === 'Rejected').length
                });

            } catch (error) {
                console.error("Error fetching merchants for analytics", error);
            }
        };
        fetchMerchants();
    }, []);

    // Custom Brand Colors
    const brandViolet = '#ebdc87';  // Violet
    const brandDarkBlue = '#915200'; // Dark Blue

    // Chart Data Configuration

    // 1. Revenue Line Chart Data - Dynamic Calculation
    // Initialize array for 12 months [Jan, Feb, ... Dec]
    const monthlyRevenue = new Array(12).fill(0);
    const monthLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    merchantsList.forEach(m => {
        const date = new Date(m.createdAt);
        const monthIndex = date.getMonth(); // 0 = Jan, 11 = Dec
        // Only consider current year or simplified all-time monthly aggregation
        // For simplicity: Aggregating all time revenue into months
        const amount = m.plan === 'Premium' ? 5000 : 1500;
        monthlyRevenue[monthIndex] += amount;
    });

    const revenueData = {
        labels: monthLabels,
        datasets: [
            {
                label: 'Revenue Growth',
                data: monthlyRevenue,
                borderColor: brandViolet,
                backgroundColor: 'rgba(138, 43, 226, 0.1)',
                tension: 0.4,
                fill: true,
                pointBackgroundColor: brandDarkBlue,
                pointBorderColor: '#fff',
                pointHoverBackgroundColor: '#fff',
                pointHoverBorderColor: brandDarkBlue,
            },
        ],
    };

    const revenueOptions = {
        responsive: true,
        plugins: {
            legend: { display: false },
            title: { display: false },
        },
        scales: {
            y: { grid: { display: false } },
            x: { grid: { display: false } }
        }
    };

    // 2. Plan Distribution Doughnut Data
    const distributionData = {
        labels: ['Premium', 'Standard'],
        datasets: [
            {
                data: [stats.premiumCount, stats.standardCount],
                backgroundColor: [brandViolet, brandDarkBlue],
                borderColor: ['#fff', '#fff'],
                borderWidth: 2,
            },
        ],
    };

    const doughnutOptions = {
        responsive: true,
        plugins: {
            legend: { position: 'bottom' },
        },
        cutout: '70%', // Thinner ring
    };

    // 3. Activity Bar Chart Data
    const activityData = {
        labels: ['Approved', 'Pending', 'Rejected'],
        datasets: [
            {
                label: 'Merchants',
                data: [
                    stats.active,
                    stats.pending,
                    stats.inactive
                ],
                backgroundColor: [brandDarkBlue, brandViolet, '#e9ecef'], // Approved, Pending, Rejected
                borderRadius: 5,
            }
        ]
    };

    const barOptions = {
        responsive: true,
        plugins: { legend: { display: false } },
        scales: {
            x: { grid: { display: false } },
            y: { grid: { borderDash: [5, 5] } }
        }
    };

    return (
        <div className="animate__animated animate__fadeIn">
            <h4 className="mb-4 text-secondary d-flex align-items-center justify-content-between">
                <span><i className="fas fa-chart-pie me-2"></i>Subscription Analytics</span>
                {/* <Badge bg="light" text="dark" className="fw-normal border">
                    <i className="fas fa-calendar-alt me-2 text-muted"></i> This Month
                </Badge> */}
            </h4>

            {/* Top Revenue & Big Stats */}
            <Row className="g-4 mb-4">
                <Col md={6}>
                    <Card className="border-0 shadow-sm h-100">
                        <Card.Body>
                            <div className="d-flex justify-content-between align-items-center mb-4">
                                <div>
                                    <h5 className="fw-bold mb-0" style={{ color: brandDarkBlue }}>Revenue Trends</h5>
                                    <p className="text-muted small mb-0">First half yearly growth</p>
                                </div>
                                <h2 className="fw-bold mb-0" style={{ color: brandDarkBlue }}>
                                    ₹{stats.revenue.toLocaleString('en-IN')}
                                </h2>
                            </div>
                            <div style={{ height: '250px' }}>
                                <Line data={revenueData} options={revenueOptions} />
                            </div>
                        </Card.Body>
                    </Card>
                </Col>

                <Col md={3}>
                    <Card className="border-0 shadow-sm h-100">
                        <Card.Body className="text-center d-flex flex-column justify-content-center">
                            <h6 className="fw-bold mb-3" style={{ color: brandDarkBlue }}>Plan Distribution</h6>
                            <div className="mx-auto position-relative" style={{ height: '180px', width: '180px' }}>
                                <Doughnut data={distributionData} options={doughnutOptions} />
                                <div className="position-absolute start-50 translate-middle text-center" style={{ top: '35%' }}>
                                    <h4 className="fw-bold mb-0" style={{ color: brandDarkBlue }}>{stats.total}</h4>
                                    <small className="text-muted" style={{ fontSize: '10px' }}>TOTAL</small>
                                </div>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>

                <Col md={3}>
                    <Card className="border-0 shadow-sm h-100">
                        <Card.Body>
                            <h6 className="fw-bold mb-3" style={{ color: brandDarkBlue }}>Merchant Status</h6>
                            <div style={{ height: '200px' }}>
                                <Bar data={activityData} options={barOptions} />
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            <Row className="g-4">
                {/* Recent Activity / List */}
                <Col md={12}>
                    <Card className="border-0 shadow-sm rounded-4 overflow-hidden">
                        <Card.Header className="bg-white border-bottom border-light py-3 px-4 d-flex justify-content-between align-items-center">
                            <h6 className="mb-0 fw-bold" style={{ color: brandDarkBlue }}>Recent Subscriptions</h6>
                            {/* <Button variant="link" className="text-decoration-none small text-muted p-0">View All</Button> */}
                        </Card.Header>
                        <Table responsive hover className="align-middle mb-0">
                            <thead className="bg-light text-secondary small text-uppercase">
                                <tr>
                                    <th className="border-0 ps-4 py-3">Merchant</th>
                                    <th className="border-0 py-3">Plan</th>
                                    <th className="border-0 py-3">Billing Cycle</th>
                                    <th className="border-0 py-3">Status</th>
                                    <th className="border-0 py-3 text-end pe-4">Joined Date</th>
                                </tr>
                            </thead>
                            <tbody>
                                {merchantsList.slice(0, 5).map(m => (
                                    <tr key={m._id}>
                                        <td className="ps-4 fw-bold" style={{ color: brandDarkBlue }}>{m.name}</td>
                                        <td>
                                            <div

                                                className="badge badge-pillpx-3"
                                                style={{
                                                    backgroundColor: m.plan === 'Premium' ? '#ebdc87' : '#f3e9bd',
                                                    color: m.plan === 'Premium' ? "#915200" : "#915200",
                                                    border: `1px solid ${m.plan === 'Premium' ? "#915200" : "#915200"}`
                                                }}
                                            >
                                                {m.plan}
                                            </div>
                                        </td>
                                        <td className="text-muted small">Monthly Auto-Debit</td>
                                        <td>
                                            <div className="d-flex align-items-center">
                                                <div style={{
                                                    width: '6px',
                                                    height: '6px',
                                                    borderRadius: '50%',
                                                    backgroundColor: m.status === 'Approved' ? '#915200' : m.status === 'Rejected' ? '#dc3545' : '#ebdc87'
                                                }} className="me-2"></div>
                                                <span className="small text-muted">{m.status || 'Pending'}</span>
                                            </div>
                                        </td>
                                        <td className="text-end pe-4 text-muted small">{new Date(m.createdAt).toLocaleDateString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </Table>
                    </Card>
                </Col>
            </Row>
        </div>
    );
};

export default Subscribers;
