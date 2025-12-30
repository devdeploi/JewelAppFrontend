import { Row, Col, Card, Table } from 'react-bootstrap';
import { Line, Doughnut, Bar } from 'react-chartjs-2';
import { merchants } from '../data/mockData';
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
    const premiumCount = merchants.filter(m => m.plan === 'Premium').length;
    const standardCount = merchants.filter(m => m.plan === 'Standard').length;
    const total = merchants.length;

    // Estimates based on assumed pricing
    const revenue = (premiumCount * 5000) + (standardCount * 1500);

    // Custom Brand Colors
    const brandViolet = '#8a2be2';  // Violet
    const brandDarkBlue = '#00008b'; // Dark Blue

    // Chart Data Configuration

    // 1. Revenue Line Chart Data
    const revenueLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    const revenueData = {
        labels: revenueLabels,
        datasets: [
            {
                label: 'Revenue Growth',
                data: [1200, 1900, 3000, 1500, 2500, revenue], // Simulated growth to current
                borderColor: brandViolet,
                backgroundColor: 'rgba(138, 43, 226, 0.1)',
                tension: 0.4, // Smooth curve
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
                data: [premiumCount, standardCount],
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
        labels: ['Active', 'Pending', 'Inactive'],
        datasets: [
            {
                label: 'Merchants',
                data: [
                    merchants.filter(m => m.status === 'Active').length,
                    merchants.filter(m => m.status === 'Pending').length,
                    merchants.filter(m => m.status === 'Inactive' || m.status === 'Suspended').length
                ],
                backgroundColor: [brandViolet, brandDarkBlue, '#e9ecef'],
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
                                <h2 className="fw-bold mb-0" style={{ color: brandViolet }}>
                                    ₹{revenue.toLocaleString('en-IN')}
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
                                    <h4 className="fw-bold mb-0" style={{ color: brandDarkBlue }}>{total}</h4>
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
                                {merchants.slice(0, 5).map(m => (
                                    <tr key={m.id}>
                                        <td className="ps-4 fw-bold" style={{ color: brandDarkBlue }}>{m.name}</td>
                                        <td>
                                            <div

                                                className="badge badge-pillpx-3"
                                                style={{
                                                    backgroundColor: m.plan === 'Premium' ? '#A67C00' : 'rgba(17, 17, 190, 0.83)',
                                                    color: m.plan === 'Premium' ? "white" : "white",
                                                    border: `1px solid ${m.plan === 'Premium' ? "white" : "white"}`
                                                }}
                                            >
                                                {m.plan}
                                            </div>
                                        </td>
                                        <td className="text-muted small">Monthly Auto-Debit</td>
                                        <td>
                                            <div className="d-flex align-items-center">
                                                <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: m.status === 'Active' ? '#198754' : '#6c757d' }} className="me-2"></div>
                                                <span className="small text-muted">{m.status}</span>
                                            </div>
                                        </td>
                                        <td className="text-end pe-4 text-muted small">{m.joined || 'N/A'}</td>
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
