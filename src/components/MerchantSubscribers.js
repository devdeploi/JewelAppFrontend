import React, { useState, useEffect } from 'react';
import { Table, Badge, Card, ProgressBar, Button, Modal, OverlayTrigger, Tooltip } from 'react-bootstrap';
import axios from 'axios';
import { APIURL, BASEURL, onError } from '../utils/Function';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const MerchantSubscribers = ({ merchantId, user, showHeader = true }) => {
    const [subscribers, setSubscribers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [pendingPayments, setPendingPayments] = useState([]);
    const [actionLoading, setActionLoading] = useState(null);
    const [highlightedUser, setHighlightedUser] = useState(null);

    // Search States
    const [searchQuery, setSearchQuery] = useState('');
    const [showSearch, setShowSearch] = useState(false);

    const [confirmModal, setConfirmModal] = useState({
        show: false,
        title: '',
        message: '',
        variant: 'primary', // primary for approve, danger for reject
        onConfirm: null
    });

    const closeConfirmModal = () => setConfirmModal({ ...confirmModal, show: false });

    const fetchPendingPayments = React.useCallback(async () => {
        try {
            if (!merchantId) return;
            const config = {
                headers: { Authorization: `Bearer ${user.token}` },
            };
            const { data } = await axios.get(`${APIURL}/payments/offline/pending`, config);
            setPendingPayments(data);
        } catch (error) {
            console.error("Error fetching pending payments", error);
        }
    }, [merchantId, user.token]);

    const fetchSubscribers = React.useCallback(async () => {
        try {
            if (!merchantId) return;
            const config = {
                headers: {
                    Authorization: `Bearer ${user.token}`,
                },
            };
            const { data } = await axios.get(`${APIURL}/chit-plans/my-subscribers`, config);
            // Deduplicate based on User ID + Plan ID to handle legacy DB duplicates
            const uniqueSubscribers = data.filter((v, i, a) => a.findIndex(t => (t.user._id === v.user._id && t.plan._id === v.plan._id)) === i);

            setSubscribers(uniqueSubscribers);
            setLoading(false);
        } catch (error) {
            console.error("Error fetching subscribers", error);
            setLoading(false);
        }
    }, [merchantId, user.token]);

    useEffect
        (() => {
            fetchSubscribers();
            fetchPendingPayments();
        }, [fetchSubscribers, fetchPendingPayments]);

    // --- Settlement State ---
    const [settlementModal, setSettlementModal] = useState({
        show: false,
        subscriber: null
    });
    const [settlementForm, setSettlementForm] = useState({
        amount: '',
        transactionId: '',
        note: ''
    });
    const [submittingSettlement, setSubmittingSettlement] = useState(false);

    const withdrawalRequests = React.useMemo(() => {
        return subscribers.filter(s =>
            s.subscription?.status === 'requested_withdrawal' &&
            s.withdrawal?.request?.status === 'pending'
        );
    }, [subscribers]);




    console.log(settlementModal);


    // --- Date Search State (Premium) ---
    const [searchDate, setSearchDate] = useState('');
    const [dailyPayments, setDailyPayments] = useState(null);
    const [searchingDate, setSearchingDate] = useState(false);
    const [showDateSearch, setShowDateSearch] = useState(false);

    const handleDateSearch = async () => {
        if (!searchDate) return;
        setSearchingDate(true);
        try {
            const config = { headers: { Authorization: `Bearer ${user.token}` } };
            const { data } = await axios.get(`${APIURL}/payments/search/date?date=${searchDate}`, config);
            setDailyPayments(data);
        } catch (error) {
            console.error("Date search failed", error);
            if (error.response?.status === 403) {
                alert("This feature is available only for Premium merchants.");
            } else {
                alert("Failed to fetch payments for this date.");
            }
        } finally {
            setSearchingDate(false);
        }
    };

    const clearDateSearch = () => {
        setSearchDate('');
        setDailyPayments(null);
    };

    const filteredSubscribers = React.useMemo(() => {
        if (!searchQuery) return subscribers;
        const lower = searchQuery.toLowerCase();
        return subscribers.filter(sub =>
            (sub.user?.name?.toLowerCase() || '').includes(lower) ||
            (sub.user?.phone || '').includes(lower) ||
            (sub.plan?.planName?.toLowerCase() || '').includes(lower)
        );
    }, [subscribers, searchQuery]);

    const handleApprove = (paymentId) => {
        setConfirmModal({
            show: true,
            title: 'Approve Payment',
            message: 'Are you sure you want to approve this offline payment? This will update the user\'s plan progress.',
            variant: 'success',
            onConfirm: () => executeApprove(paymentId)
        });
    };

    const executeApprove = async (paymentId) => {
        setActionLoading(paymentId);
        closeConfirmModal();
        try {
            // Find the payment object before approving to use for invoice
            const payment = pendingPayments.find(p => p._id === paymentId);
            const userIdToHighlight = payment?.user?._id;

            const config = { headers: { Authorization: `Bearer ${user.token}` } };
            await axios.put(`${APIURL}/payments/offline/${paymentId}/approve`, {}, config);

            // Show Success Modal
            if (payment) {
                // Construct a subscriber-like object for the invoice generator
                const subscriberData = {
                    user: payment.user,
                    plan: payment.chitPlan // Map chitPlan to plan for consistency
                };

                setSuccessModal({
                    show: true,
                    title: 'Payment Approved!',
                    message: `You have successfully approved the payment of ₹${payment.amount}.`,
                    payment: { ...payment, status: 'Completed', type: 'Offline' },
                    subscriber: subscriberData
                });
            }

            // Refresh Both Lists Immediately
            await fetchPendingPayments();
            await fetchSubscribers();

            if (userIdToHighlight) {
                setHighlightedUser(userIdToHighlight);
                setTimeout(() => setHighlightedUser(null), 3000);
            }

        } catch (error) {
            console.error("Approve failed", error);
            alert("Failed to approve payment");
        } finally {
            setActionLoading(null);
        }
    };

    const handleReject = (paymentId) => {
        setConfirmModal({
            show: true,
            title: 'Reject Payment',
            message: 'Are you sure you want to reject this payment? This action cannot be undone.',
            variant: 'danger',
            onConfirm: () => executeReject(paymentId)
        });
    };

    const executeReject = async (paymentId) => {
        setActionLoading(paymentId);
        closeConfirmModal();
        try {
            const config = { headers: { Authorization: `Bearer ${user.token}` } };
            await axios.put(`${APIURL}/payments/offline/${paymentId}/reject`, {}, config);

            fetchPendingPayments();
            fetchSubscribers();
        } catch (error) {
            console.error("Reject failed", error);
            alert("Failed to reject payment");
        } finally {
            setActionLoading(null);
        }
    };

    // Manual Payment State
    const [manualPaymentModal, setManualPaymentModal] = useState(false);
    const [selectedSubscriber, setSelectedSubscriber] = useState(null);
    const [manualForm, setManualForm] = useState({ amount: '', notes: '' });
    // removed paymentSuccessData state as it is replaced by successModal

    const [submittingManual, setSubmittingManual] = useState(false);

    // Unified Success Modal State
    const [successModal, setSuccessModal] = useState({
        show: false,
        title: '',
        message: '',
        payment: null,
        subscriber: null
    });

    // Offline Payment Details Modal
    const [offlineDetailsModal, setOfflineDetailsModal] = useState({
        show: false,
        payment: null
    });

    const viewOfflineDetails = (payment) => {
        setOfflineDetailsModal({
            show: true,
            payment
        });
    };

    // History Details State
    const [showHistoryModal, setShowHistoryModal] = useState(false);
    const [paymentHistory, setPaymentHistory] = useState([]);
    const [loadingHistory, setLoadingHistory] = useState(false);

    // Helper to fetch image and convert to base64
    const fetchImageAsBase64 = async (url) => {
        try {
            const response = await fetch(url);
            const blob = await response.blob();
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result);
                reader.onerror = reject;
                reader.readAsDataURL(blob);
            });
        } catch (error) {
            console.error("Error fetching image:", error);
            return null;
        }
    };

    // Helper to extract plan details safely
    const getPlanDetails = (subscriber) => {
        if (subscriber.plan) return subscriber.plan;
        if (subscriber.chitPlan) return subscriber.chitPlan;
        return { planName: 'Unknown Plan', durationMonths: 0, totalAmount: 0 };
    };


    // PDF Generation Logic
    const generateInvoice = async (payment, subscriber) => {
        const doc = new jsPDF();

        // Settings
        const primaryColor = [145, 82, 0]; // #915200
        const lightBg = [255, 251, 240]; // #fffbf0

        // 1. Load Logos
        const aurumLogoUrl = `${window.location.origin}/images/AURUM.png`;
        const safproLogoUrl = `${window.location.origin}/images/assests/Safpro-logo.png`;

        const [aurumLogoBase64, safproLogoBase64] = await Promise.all([
            fetchImageAsBase64(aurumLogoUrl),
            fetchImageAsBase64(safproLogoUrl)
        ]);

        let shopLogoBase64 = null;
        if (user.shopLogo) {
            shopLogoBase64 = await fetchImageAsBase64(`${BASEURL}${user.shopLogo}`);
        }

        // 2. Header Section
        // Background strip for header
        doc.setFillColor(...lightBg);
        doc.rect(0, 0, 210, 45, 'F');
        doc.setDrawColor(...primaryColor);
        doc.setLineWidth(1);
        doc.line(0, 45, 210, 45);

        // A. Left Logo (Aurum)
        if (aurumLogoBase64) {
            doc.addImage(aurumLogoBase64, 'PNG', 15, 10, 35, 25);
        }

        // B. Center Content (Business Name & Address)
        doc.setTextColor(...primaryColor);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(16);
        doc.text(user.name.toUpperCase(), 105, 18, { align: 'center' });

        doc.setFontSize(10);
        doc.setTextColor(100);
        doc.setFont('helvetica', 'normal');
        const addressLines = doc.splitTextToSize(user.address || user.city || '', 80);
        doc.text(addressLines, 105, 25, { align: 'center' });

        let contactInfo = `Phone: ${user.phone}`;
        if (user.email) contactInfo += ` | ${user.email}`;
        // Calculate dynamic Y to reduce extra space between address and contact info
        const contactY = 25 + (addressLines.length * 5) + 2;
        doc.text(contactInfo, 105, contactY, { align: 'center' });

        // C. Right Logo (Shop Logo)
        if (shopLogoBase64) {
            // Draw a circular frame if possible, for now just a square/rect is easier with addImage
            // To make it look "premium", let's just add it.
            doc.addImage(shopLogoBase64, 'PNG', 165, 10, 25, 25);
        }

        // 3. Document Title
        const startY = 60;
        doc.setFontSize(22);
        doc.setTextColor(...primaryColor);
        doc.setFont('helvetica', 'bold');
        doc.text("PAYMENT RECEIPT", 105, startY, { align: 'center' });

        doc.setFontSize(10);
        doc.setTextColor(100);
        doc.setFont('helvetica', 'normal');
        doc.text(`Date: ${new Date().toLocaleDateString()}`, 105, startY + 8, { align: 'center' });

        // 4. Client Info
        const infoY = startY + 25;
        doc.setFontSize(11);
        doc.setTextColor(...primaryColor);
        doc.setFont('helvetica', 'bold');
        doc.text("TO:", 15, infoY);

        doc.setFontSize(12);
        doc.setTextColor(0, 0, 0);
        doc.text(subscriber.user.name.toUpperCase(), 15, infoY + 7);

        doc.setFontSize(10);
        doc.setTextColor(80);
        doc.setFont('helvetica', 'normal');
        doc.text(`Phone: ${subscriber.user.phone}`, 15, infoY + 13);
        if (subscriber.user.email) doc.text(subscriber.user.email, 15, infoY + 18);

        // 5. Table Data
        const planDetails = getPlanDetails(subscriber);
        const tableColumn = ["Description", "Details", "Amount (INR)"];
        const tableRows = [
            ["Plan Name", planDetails.planName, ""],
            ["Payment Mode", payment.type || "Offline", ""],
            ["Payment Date", new Date(payment.paymentDate || payment.date || new Date()).toLocaleDateString(), ""],
            ["Notes", payment.notes || "-", ""],
        ];

        if (payment.commissionAmount > 0) {
            tableRows.push(["Platform Fee (Online)", "", `Rs. ${Number(payment.commissionAmount).toFixed(2)}`]);
        }

        const grandTotal = Number(payment.amount) + (Number(payment.commissionAmount) || 0);

        tableRows.push(
            [{ content: "TOTAL RECEIVED", styles: { fontStyle: 'bold', fillColor: lightBg } }, "", { content: `Rs. ${grandTotal.toFixed(2)}`, styles: { fontStyle: 'bold', textColor: primaryColor, halign: 'right' } }]
        );

        // 6. Styled Table
        autoTable(doc, {
            startY: infoY + 30,
            head: [tableColumn],
            body: tableRows,
            theme: 'grid',
            headStyles: {
                fillColor: primaryColor,
                textColor: [255, 255, 255],
                fontStyle: 'bold',
                halign: 'center'
            },
            styles: {
                fontSize: 10,
                cellPadding: 5,
                lineColor: [220, 220, 220],
                lineWidth: 0.1
            },
            columnStyles: {
                0: { fontStyle: 'bold', cellWidth: 80 },
                1: { cellWidth: 'auto' },
                2: { fontStyle: 'bold', halign: 'right', cellWidth: 40 }
            }
        });

        const finalY = doc.lastAutoTable.finalY + 20;

        // 7. Footer
        doc.setFontSize(12);
        doc.setTextColor(...primaryColor);
        doc.setFont('helvetica', 'bold');
        doc.text("Thank you!", 105, finalY, { align: 'center' });

        doc.setFontSize(9);
        doc.setTextColor(100);
        doc.setFont('helvetica', 'normal');
        doc.text("If you have any questions about this receipt, please contact the merchant.", 105, finalY + 7, { align: 'center' });

        // Branding and Safpro Logo
        const footerY = finalY + 25;
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text("Powered By", 105, footerY, { align: 'center' });

        if (safproLogoBase64) {
            doc.addImage(safproLogoBase64, 'PNG', 90, footerY + 2, 30, 15);
        }

        doc.save(`Receipt_${subscriber.user.name}_${new Date().getTime()}.pdf`);
    };

    const generateSettlementReceipt = async (subscriber, settlementData) => {
        const doc = new jsPDF();

        // Brand Colors
        const primaryColor = [145, 82, 0];
        const lightBg = [255, 251, 240];

        // 1. Load Logos (reusing same logic)
        const aurumLogoUrl = `${window.location.origin}/images/AURUM.png`;
        const safproLogoUrl = `${window.location.origin}/images/assests/Safpro-logo.png`;

        const [aurumLogoBase64, safproLogoBase64] = await Promise.all([
            fetchImageAsBase64(aurumLogoUrl),
            fetchImageAsBase64(safproLogoUrl)
        ]);

        let shopLogoBase64 = null;
        if (user.shopLogo) {
            shopLogoBase64 = await fetchImageAsBase64(`${BASEURL}${user.shopLogo}`);
        }

        // Header
        doc.setFillColor(...lightBg);
        doc.rect(0, 0, 210, 45, 'F');
        doc.setDrawColor(...primaryColor);
        doc.setLineWidth(1);
        doc.line(0, 45, 210, 45);

        if (aurumLogoBase64) doc.addImage(aurumLogoBase64, 'PNG', 15, 10, 35, 25);

        doc.setTextColor(...primaryColor);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(16);
        doc.text(user.name.toUpperCase(), 105, 18, { align: 'center' });

        doc.setFontSize(10);
        doc.setTextColor(100);
        doc.setFont('helvetica', 'normal');
        doc.text("SETTLEMENT RECEIPT", 105, 30, { align: 'center' });

        // Add Date under Title to match Mobile
        doc.setFontSize(10);
        doc.setTextColor(100);
        doc.text(`Date: ${new Date().toLocaleDateString()}`, 105, 35, { align: 'center' });


        if (shopLogoBase64) doc.addImage(shopLogoBase64, 'PNG', 165, 10, 25, 25);

        // Body
        let y = 60;
        doc.setFontSize(12);
        doc.setTextColor(0);
        doc.text(`To: ${subscriber.user.name.toUpperCase()}`, 15, y);
        y += 7;
        doc.text(`Plan: ${subscriber.plan.planName}`, 15, y);
        y += 15;

        // Table
        autoTable(doc, {
            startY: y,
            head: [['Description', 'Details']],
            body: [
                ['Settlement Amount', `Rs. ${Number(settlementData.amount).toFixed(2)}`],
                ['Transaction Ref', settlementData.transactionId],
                ['Note', settlementData.note || '-']
            ],
            theme: 'grid',
            headStyles: { fillColor: primaryColor }
        });

        const finalY = doc.lastAutoTable.finalY + 20;
        doc.text("This amounts fully settles the chit plan.", 105, finalY, { align: 'center' });

        if (safproLogoBase64) {
            doc.addImage(safproLogoBase64, 'PNG', 90, finalY + 10, 30, 15);
        }

        doc.save(`Settlement_${subscriber.user.name}.pdf`);
    };

    const executeSettlement = async () => {
        if (!settlementForm.amount || !settlementForm.transactionId) {
            alert("Please enter amount and transaction ID.");
            return;
        }

        setSubmittingSettlement(true);
        try {
            const config = { headers: { Authorization: `Bearer ${user.token}` } };
            const planId = settlementModal.subscriber.plan._id;
            const userId = settlementModal.subscriber.user._id;

            await axios.post(`${APIURL}/chit-plans/${planId}/settle`, {
                userId,
                amount: settlementForm.amount,
                transactionId: settlementForm.transactionId,
                note: settlementForm.note
            }, config);

            // Close modal
            const settledSub = settlementModal.subscriber;
            const settlementData = { ...settlementForm };
            setSettlementModal({ show: false, subscriber: null });

            // Show success alert and offer receipt
            // Since we don't have a complex alert system here, we just use standard confirm or alert
            if (window.confirm("Settlement Successful! Click OK to download receipt.")) {
                generateSettlementReceipt(settledSub, settlementData);
            }

            fetchSubscribers();
        } catch (error) {
            console.error(error);
            alert("Failed to process settlement.");
        } finally {
            setSubmittingSettlement(false);
        }
    };




    const generateStatement = async (subscriber, history) => {
        const doc = new jsPDF();

        // Settings for Brand Consistency
        const primaryColor = [145, 82, 0]; // #915200
        const lightBg = [255, 251, 240]; // #fffbf0

        // 1. Load Logos
        const aurumLogoUrl = `${window.location.origin}/images/AURUM.png`;
        const safproLogoUrl = `${window.location.origin}/images/assests/Safpro-logo.png`;

        const [aurumLogoBase64, safproLogoBase64] = await Promise.all([
            fetchImageAsBase64(aurumLogoUrl),
            fetchImageAsBase64(safproLogoUrl)
        ]);

        let shopLogoBase64 = null;
        if (user.shopLogo) {
            shopLogoBase64 = await fetchImageAsBase64(`${BASEURL}${user.shopLogo}`);
        }

        // 2. Header Section
        doc.setFillColor(...lightBg);
        doc.rect(0, 0, 210, 45, 'F');
        doc.setDrawColor(...primaryColor);
        doc.setLineWidth(1);
        doc.line(0, 45, 210, 45);

        // A. Left Logo
        if (aurumLogoBase64) {
            doc.addImage(aurumLogoBase64, 'PNG', 15, 10, 35, 25);
        }

        // B. Center Content
        doc.setTextColor(...primaryColor);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(16);
        doc.text(user.name.toUpperCase(), 105, 18, { align: 'center' });

        doc.setFontSize(10);
        doc.setTextColor(100);
        doc.setFont('helvetica', 'normal');
        const addressLines = doc.splitTextToSize(user.address || user.city || '', 80);
        doc.text(addressLines, 105, 25, { align: 'center' });

        let contactInfo = `Phone: ${user.phone}`;
        if (user.email) contactInfo += ` | ${user.email}`;
        // Calculate dynamic Y to reduce extra space between address and contact info
        const contactY = 25 + (addressLines.length * 5) + 2;
        doc.text(contactInfo, 105, contactY, { align: 'center' });

        // C. Right Logo
        if (shopLogoBase64) {
            doc.addImage(shopLogoBase64, 'PNG', 165, 10, 25, 25);
        }

        // 3. Document Title
        const startY = 60;
        doc.setFontSize(22);
        doc.setTextColor(...primaryColor);
        doc.setFont('helvetica', 'bold');
        doc.text("STATEMENT OF ACCOUNT", 105, startY, { align: 'center' });

        doc.setFontSize(10);
        doc.setTextColor(100);
        doc.setFont('helvetica', 'normal');
        doc.text(`Generated On: ${new Date().toLocaleDateString()}`, 105, startY + 8, { align: 'center' });

        // 4. Client Info
        const infoY = startY + 25;
        doc.setFontSize(11);
        doc.setTextColor(...primaryColor);
        doc.setFont('helvetica', 'bold');
        doc.text("BILL TO:", 15, infoY);

        doc.setFontSize(12);
        doc.setTextColor(0, 0, 0);
        doc.text(subscriber.user.name.toUpperCase(), 15, infoY + 7);

        doc.setFontSize(10);
        doc.setTextColor(80);
        doc.setFont('helvetica', 'normal');
        doc.text(`Phone: ${subscriber.user.phone}`, 15, infoY + 13);

        // Plan Context Line
        const planDetails = getPlanDetails(subscriber);
        doc.setTextColor(0);
        doc.setFont('helvetica', 'bold');
        doc.text(`Plan: ${planDetails.planName} (Total Value: Rs. ${Number(planDetails.totalAmount).toLocaleString()})`, 15, infoY + 25);

        // 5. Transaction Table
        let totalPaid = 0;
        const tableColumn = ["Date", "Description", "Type", "Amount (INR)"];
        const tableRows = [];

        const sortedHistory = [...history].sort((a, b) => new Date(a.paymentDate) - new Date(b.paymentDate));

        sortedHistory.forEach(pay => {
            if (pay.status === 'Completed') {
                totalPaid += Number(pay.amount);
            }
            tableRows.push([
                new Date(pay.paymentDate || pay.createdAt).toLocaleDateString(),
                pay.notes || "Installment Payment",
                pay.type === 'offline' ? 'Offline' : 'Online',
                `Rs. ${Number(pay.amount).toFixed(2)}`
            ]);
        });

        const balanceDue = planDetails.totalAmount - totalPaid;

        tableRows.push([
            { content: "", colSpan: 2, styles: { fillColor: [255, 255, 255] } },
            { content: "TOTAL PAID", styles: { fontStyle: 'bold', fillColor: lightBg } },
            { content: `Rs. ${totalPaid.toFixed(2)}`, styles: { fontStyle: 'bold', textColor: primaryColor, halign: 'right' } }
        ]);

        tableRows.push([
            { content: "", colSpan: 2, styles: { fillColor: [255, 255, 255] } },
            { content: "BALANCE", styles: { fontStyle: 'bold', fillColor: lightBg } },
            { content: `Rs. ${balanceDue.toFixed(2)}`, styles: { fontStyle: 'bold', textColor: balanceDue > 0 ? [220, 53, 69] : [25, 135, 84], halign: 'right' } }
        ]);

        // --- Add Settlement Details if Settled ---
        if (subscriber.subscription.status === 'settled') {
            // Add a visual separator or header for settlement
            tableRows.push([
                { content: "SETTLEMENT DETAILS", colSpan: 4, styles: { fontStyle: 'bold', fillColor: primaryColor, textColor: [255, 255, 255], halign: 'center' } }
            ]);

            const details = subscriber.subscription.settlementDetails || {};
            // Using settlementDetails from updated backend controller
            const settlementAmount = details.amount || totalPaid;
            const settlementDate = details.settledDate ? new Date(details.settledDate).toLocaleDateString() : new Date().toLocaleDateString();
            const settlementTxnId = details.transactionId || 'N/A';
            const settlementNotes = details.note || 'Settled';

            tableRows.push([
                settlementDate,
                `Settlement (Txn: ${settlementTxnId})\nNotes: ${settlementNotes}`,
                "SETTLEMENT",
                `Rs. ${Number(settlementAmount).toFixed(2)}`
            ]);
        }

        autoTable(doc, {
            startY: infoY + 35,
            head: [tableColumn],
            body: tableRows,
            theme: 'grid',
            headStyles: {
                fillColor: primaryColor,
                textColor: [255, 255, 255],
                fontStyle: 'bold',
                halign: 'center',
                fontSize: 9,
                cellPadding: 2
            },
            styles: {
                fontSize: 9,
                cellPadding: 2,
                lineColor: [80, 80, 80],
                lineWidth: 0.1,
                valign: 'middle'
            },
            columnStyles: {
                0: { cellWidth: 25 },
                1: { cellWidth: 'auto' },
                2: { cellWidth: 25 },
                3: { fontStyle: 'bold', halign: 'right', cellWidth: 35 }
            }
        });

        const finalY = doc.lastAutoTable.finalY + 20;

        // 7. Footer
        doc.setFontSize(12);
        doc.setTextColor(...primaryColor);
        doc.setFont('helvetica', 'bold');
        doc.text("Thank you for your business!", 105, finalY, { align: 'center' });

        // Branding and Safpro Logo
        const footerY = finalY + 15;
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text("Powered By", 105, footerY, { align: 'center' });

        if (safproLogoBase64) {
            doc.addImage(safproLogoBase64, 'PNG', 90, footerY + 2, 30, 15);
        }

        // Bottom Branding


        doc.save(`Statement_${subscriber.user.name}.pdf`);
    };

    const openHistoryModal = async (subscriber) => {
        setSelectedSubscriber(subscriber);
        setShowHistoryModal(true);
        setLoadingHistory(true);
        try {
            const config = { headers: { Authorization: `Bearer ${user.token}` } };
            const { data } = await axios.get(`${APIURL}/payments/history/${subscriber.plan._id}/${subscriber.user._id}`, config);
            setPaymentHistory(data);
        } catch (error) {
            console.error("Error fetching history", error);
            alert("Failed to fetch payment history");
        } finally {
            setLoadingHistory(false);
        }
    };

    const openManualPaymentModal = (subscriber) => {
        setSelectedSubscriber(subscriber);
        setManualForm({ amount: subscriber.plan.monthlyAmount.toString(), notes: '' });
        setManualPaymentModal(true);
    };

    const submitManualPayment = async () => {
        if (!selectedSubscriber) return;
        setSubmittingManual(true);
        try {
            const config = { headers: { Authorization: `Bearer ${user.token}` } };
            const payload = {
                chitPlanId: selectedSubscriber.plan._id,
                userId: selectedSubscriber.user._id,
                amount: manualForm.amount,
                notes: manualForm.notes,
                date: new Date().toISOString()
            };

            const { data } = await axios.post(`${APIURL}/payments/offline/record`, payload, config);

            // Assuming data contains the payment object or we construct a temp one
            const paymentData = data.payment || {
                ...payload,
                _id: data._id || 'TEMP-' + Date.now(), // Fallback if ID not returned
                type: 'offline',
                status: 'Completed' // Assumed since it's manual record
            };

            // Don't modify manualPaymentModal state here anymore
            // Close manual modal and open success modal
            setManualPaymentModal(false);

            setSuccessModal({
                show: true,
                title: 'Payment Recorded!',
                message: `You have successfully recorded a payment of ₹${paymentData.amount}.`,
                payment: paymentData,
                subscriber: selectedSubscriber
            });

            // Refresh Data in background
            fetchSubscribers();
            if (selectedSubscriber.user._id) {
                setHighlightedUser(selectedSubscriber.user._id);
                setTimeout(() => setHighlightedUser(null), 3000);
            }

        } catch (error) {
            console.error("Manual payment failed", error);
            alert("Failed to record payment");
            alert("Failed to record payment");
            // Do not close modal on error so user can retry
        } finally {
            setSubmittingManual(false);
        }
    };



    return (
        <div className="mb-5">
            {showHeader && (
                <div className="d-flex align-items-center justify-content-between mb-4">
                    <div className="d-flex align-items-center">
                        <div className="rounded-circle d-flex align-items-center justify-content-center me-3"
                            style={{ width: '50px', height: '50px', background: 'linear-gradient(135deg, #f3e9bd 0%, #ebdc87 100%)', color: '#915200' }}>
                            <i className="fas fa-users-cog fa-lg"></i>
                        </div>
                        <div>
                            <h5 className="fw-bold mb-0" style={{ color: '#915200' }}>User Subscriptions</h5>
                            <small className="text-muted">Manage subscriber payments & dues</small>
                        </div>
                    </div>
                    <div className="d-flex gap-2">
                        {user?.plan === 'Premium' && (
                            <Button
                                variant="light"
                                size="sm"
                                className="rounded-circle shadow-sm d-flex align-items-center justify-content-center"
                                style={{ width: '40px', height: '40px', color: '#915200' }}
                                onClick={() => setShowDateSearch(!showDateSearch)}
                                title="Search by Date"
                            >
                                <i className={`fas ${showDateSearch ? 'fa-times' : 'fa-calendar-alt'}`}></i>
                            </Button>
                        )}
                        <Button
                            variant="light"
                            size="sm"
                            className="rounded-circle shadow-sm d-flex align-items-center justify-content-center"
                            style={{ width: '40px', height: '40px', color: '#915200' }}
                            onClick={() => setShowSearch(!showSearch)}
                            title="Search Users"
                        >
                            <i className={`fas ${showSearch ? 'fa-times' : 'fa-search'}`}></i>
                        </Button>
                    </div>
                </div>
            )}

            {/* --- Date Filter Section (REMOVED: Moved to User Subscriptions Header) --- */}

            {withdrawalRequests.length > 0 && (
                <Card className="border-0 shadow-sm rounded-4 mb-4 overflow-hidden">
                    <Card.Header className="bg-white border-0 py-3 mx-2 mt-2">
                        <div className="d-flex align-items-center">
                            <div className="rounded-circle d-flex align-items-center justify-content-center me-3"
                                style={{ width: '40px', height: '40px', backgroundColor: '#fffbf0', color: '#915200' }}>
                                <i className="fas fa-money-check-alt"></i>
                            </div>
                            <div>
                                <h6 className="fw-bold mb-0" style={{ color: '#915200' }}>Withdrawal Requests</h6>
                                <small className="text-muted">{withdrawalRequests.length} pending request(s)</small>
                            </div>
                        </div>
                    </Card.Header>

                    <Table responsive hover className="mb-0 align-middle">
                        <thead style={{ backgroundColor: '#f8f9fa' }}>
                            <tr>
                                <th className="ps-4 py-3 text-secondary text-uppercase small">User</th>
                                <th className="py-3 text-secondary text-uppercase small">Plan Details</th>
                                <th className="py-3 text-secondary text-uppercase small">Saved Amount</th>
                                <th className="py-3 text-secondary text-uppercase small">Bank Details</th>
                                <th className="py-3 text-secondary text-uppercase small">Message</th>
                                <th className="py-3 pe-4 text-end text-secondary text-uppercase small">Action</th>
                            </tr>
                        </thead>

                        <tbody>
                            {withdrawalRequests.map(req => (
                                <tr key={req.subscriberId}>
                                    <td className="ps-4">
                                        <div className="d-flex align-items-center">
                                            <div className="rounded-circle d-flex align-items-center justify-content-center me-2 bg-light border"
                                                style={{ width: '35px', height: '35px' }}>
                                                <span className="fw-bold small" style={{ color: '#915200' }}>{req.user.name?.charAt(0)}</span>
                                            </div>
                                            <div className="fw-bold text-dark">{req.user.name}</div>
                                        </div>
                                    </td>

                                    <td>
                                        <Badge bg="light" text="dark" className="border px-2 py-1 fw-normal">
                                            {req.plan.planName}
                                        </Badge>
                                    </td>

                                    <td>
                                        <span className="fw-bold text-success">₹{Number(req.subscription.totalAmountPaid).toLocaleString()}</span>
                                    </td>

                                    <td className="small text-muted" style={{ maxWidth: '200px' }}>
                                        <div className="fw-bold text-dark mb-1"><i className="fas fa-university me-1 text-secondary"></i>{req.withdrawal.request.bankName}</div>
                                        <div>A/C: <span className="font-monospace">{req.withdrawal.request.accountNumber}</span></div>
                                        <div>IFSC: <span className="font-monospace">{req.withdrawal.request.ifsc}</span></div>
                                    </td>

                                    <td className="small fst-italic text-muted">
                                        {req.withdrawal.request.message ? `"${req.withdrawal.request.message}"` : '-'}
                                    </td>

                                    <td className="text-end pe-4">
                                        <Button
                                            size="sm"
                                            className="px-3 rounded-pill fw-bold shadow-sm"
                                            style={{
                                                backgroundColor: '#915200',
                                                borderColor: '#915200',
                                                fontSize: '0.8rem'
                                            }}
                                            onClick={() => {
                                                setSettlementForm({
                                                    amount: req.subscription.totalAmountPaid.toString(),
                                                    transactionId: '',
                                                    note: ''
                                                });
                                                setSettlementModal({ show: true, subscriber: req });
                                            }}
                                        >
                                            <i className="fas fa-check-circle me-1"></i> Settle
                                        </Button>
                                    </td>
                                </tr>

                            ))}
                        </tbody>
                    </Table>
                </Card>
            )}


            {/* Pending Payments Section */}
            {pendingPayments.length > 0 && (
                <Card className="border-0 shadow-sm rounded-4 mb-4 overflow-hidden">
                    <Card.Header className="bg-white border-0 py-3 mx-2 mt-2">
                        <div className="d-flex align-items-center">
                            <div className="rounded-circle d-flex align-items-center justify-content-center me-3"
                                style={{ width: '40px', height: '40px', backgroundColor: '#fff3cd', color: '#ffc107' }}>
                                <i className="fas fa-clock"></i>
                            </div>
                            <div>
                                <h6 className="fw-bold mb-0" style={{ color: '#915200' }}>Pending Offline Validations</h6>
                                <small className="text-muted">{pendingPayments.length} payment(s) pending approval</small>
                            </div>
                        </div>
                    </Card.Header>
                    <Table responsive hover className="mb-0 align-middle">
                        <thead style={{ backgroundColor: '#f8f9fa' }}>
                            <tr>
                                <th className="ps-4 py-3 text-secondary text-uppercase small">User Details</th>
                                <th className="py-3 text-secondary text-uppercase small">Plan</th>
                                <th className="py-3 text-secondary text-uppercase small">Amount</th>
                                <th className="py-3 text-secondary text-uppercase small">Proof</th>
                                <th className="py-3 text-secondary text-uppercase small">Notes</th>
                                <th className="py-3 pe-4 text-end text-secondary text-uppercase small">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {pendingPayments.map((payment) => (
                                <tr key={payment._id}>
                                    <td className="ps-4">
                                        <div className="d-flex align-items-center py-2">
                                            {payment.user?.profileImage ? (
                                                <img
                                                    src={`${BASEURL}${payment.user.profileImage}`}
                                                    className="rounded-circle me-3 border"
                                                    width="40" height="40"
                                                    onError={onError}
                                                    alt=""
                                                    style={{ objectFit: 'cover' }}
                                                />
                                            ) : (
                                                <div className="rounded-circle me-3 border d-flex align-items-center justify-content-center bg-light" style={{ width: '40px', height: '40px' }}>
                                                    <span className="fw-bold small text-muted">{payment.user?.name?.charAt(0)}</span>
                                                </div>
                                            )}
                                            <div>
                                                <div className="fw-bold text-dark">{payment.user?.name || 'Unknown'}</div>
                                                <div className="small text-muted"><i className="fas fa-phone me-1" style={{ fontSize: '0.7rem' }}></i>{payment.user?.phone}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        <Badge bg="light" text="dark" className="border px-2 py-1 fw-normal">
                                            {payment.chitPlan?.planName}
                                        </Badge>
                                    </td>
                                    <td>
                                        <span className="fw-bold text-dark">₹{payment.amount}</span>
                                        <div className="small text-muted" style={{ fontSize: '0.75rem' }}>{new Date(payment.paymentDate).toLocaleDateString()}</div>
                                    </td>
                                    <td>
                                        <Button
                                            variant="light"
                                            size="sm"
                                            className="d-inline-flex align-items-center text-decoration-none px-3 py-1 rounded-pill border small hover-shadow"
                                            style={{ color: '#915200', borderColor: '#e0e0e0', backgroundColor: '#fff' }}
                                            onClick={() => viewOfflineDetails(payment)}
                                        >
                                            <i className="fas fa-eye me-2"></i> View Details
                                        </Button>
                                    </td>
                                    <td className="small text-muted" style={{ maxWidth: '150px' }} title={payment.notes}>
                                        {payment.notes ? (payment.notes.length > 20 ? payment.notes.substring(0, 20) + '...' : payment.notes) : '-'}
                                    </td>
                                    <td className="text-end pe-4">
                                        <div className="d-flex justify-content-end gap-2">
                                            <OverlayTrigger placement="top" overlay={<Tooltip>Approve Payment</Tooltip>}>
                                                <Button
                                                    variant="success"
                                                    size="sm"
                                                    className="rounded-circle d-flex align-items-center justify-content-center shadow-sm"
                                                    style={{ width: '32px', height: '32px', backgroundColor: '#28a745', borderColor: '#28a745' }}
                                                    disabled={actionLoading === payment._id}
                                                    onClick={() => handleApprove(payment._id)}
                                                >
                                                    {actionLoading === payment._id ? <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> : <i className="fas fa-check"></i>}
                                                </Button>
                                            </OverlayTrigger>

                                            <OverlayTrigger placement="top" overlay={<Tooltip>Reject Payment</Tooltip>}>
                                                <Button
                                                    variant="danger"
                                                    size="sm"
                                                    className="rounded-circle d-flex align-items-center justify-content-center shadow-sm"
                                                    style={{ width: '32px', height: '32px' }}
                                                    disabled={actionLoading === payment._id}
                                                    onClick={() => handleReject(payment._id)}
                                                >
                                                    <i className="fas fa-times"></i>
                                                </Button>
                                            </OverlayTrigger>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </Table>
                </Card>
            )}

            <Card className="border-0 shadow-sm rounded-4 overflow-hidden">
                {(showDateSearch || showSearch) && (
                    <Card.Header className="bg-white border-0 py-3 mx-2 mt-2">
                        <div className="p-3 bg-light rounded-3 animate__animated animate__fadeIn">
                            {/* Date Search UI */}
                            {user?.plan === 'Premium' && showDateSearch && (
                                <div className="mb-3">
                                    <h6 className="text-uppercase text-muted small fw-bold mb-2">Search Payments By Date</h6>
                                    <div className="d-flex gap-2 mb-3">
                                        <input
                                            type="date"
                                            className="form-control form-control-sm"
                                            value={searchDate}
                                            onChange={(e) => setSearchDate(e.target.value)}
                                            style={{ maxWidth: '100%' }}
                                        />
                                        <Button
                                            size="sm"
                                            style={{ backgroundColor: '#915200', borderColor: '#915200', color: 'white' }}
                                            onClick={handleDateSearch}
                                            disabled={searchingDate || !searchDate}
                                        >
                                            {searchingDate ? 'Searching...' : 'Search'}
                                        </Button>
                                        {dailyPayments && (
                                            <Button variant="outline-secondary" size="sm" onClick={clearDateSearch}>Clear</Button>
                                        )}
                                    </div>

                                    {/* Daily Payments Results */}
                                    {dailyPayments && (
                                        <div className="bg-white p-3 rounded border">
                                            <h6 className="fw-bold mb-2 small text-muted">
                                                Date Results: {new Date(searchDate).toLocaleDateString()} ({dailyPayments.length})
                                            </h6>
                                            {dailyPayments.length === 0 ? (
                                                <p className="text-muted small mb-0">No payments found.</p>
                                            ) : (
                                                <div className="table-responsive" style={{ maxHeight: '200px' }}>
                                                    <Table size="sm" hover className="mb-0 small">
                                                        <thead>
                                                            <tr>
                                                                <th>User</th>
                                                                <th>Plan</th>
                                                                <th>Amount</th>
                                                                <th>Type</th>
                                                                <th>Action</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {dailyPayments.map(pay => (
                                                                <tr key={pay._id}>
                                                                    <td>{pay.user?.name}</td>
                                                                    <td>{pay.chitPlan?.planName}</td>
                                                                    <td className="text-success fw-bold">₹{pay.amount}</td>
                                                                    <td>{pay.type}</td>
                                                                    <td>
                                                                        <Button
                                                                            variant="link"
                                                                            size="sm"
                                                                            className="p-0 text-decoration-none"
                                                                            style={{ color: '#915200' }}
                                                                            onClick={() => generateInvoice(pay, { user: pay.user, plan: pay.chitPlan })}
                                                                        >
                                                                            <i className="fas fa-file-invoice"></i>
                                                                        </Button>
                                                                    </td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </Table>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* User Search UI */}
                            {showSearch && (
                                <div>
                                    <h6 className="text-uppercase text-muted small fw-bold mb-2">Search Subscribers</h6>
                                    <div className="input-group input-group-sm">
                                        <span className="input-group-text bg-white border-end-0"><i className="fas fa-search text-muted"></i></span>
                                        <input
                                            type="text"
                                            className="form-control border-start-0"
                                            placeholder="Search by Name, Phone, or Plan..."
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            autoFocus
                                        />
                                        {searchQuery && (
                                            <Button variant="outline-secondary" onClick={() => setSearchQuery('')}>
                                                <i className="fas fa-times"></i>
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </Card.Header>
                )}

                {loading ? (
                    <div className="text-center p-5">
                        <div className="spinner-border text-warning" role="status">
                            <span className="visually-hidden">Loading...</span>
                        </div>
                    </div>
                ) : filteredSubscribers.length === 0 ? (
                    <div className="text-center p-5 text-muted">
                        <i className="fas fa-inbox fa-3x mb-3 opacity-25"></i>
                        <p>{searchQuery ? 'No subscribers match your search.' : 'No subscribers found yet.'}</p>
                    </div>
                ) : (
                    <Table responsive hover className="mb-0 custom-table bg-white">
                        <thead className="bg-light">
                            <tr>
                                <th className="py-3 ps-4" style={{ color: '#915200', textTransform: 'uppercase', fontSize: '0.85rem' }}>User Details</th>
                                <th className="py-3" style={{ color: '#915200', textTransform: 'uppercase', fontSize: '0.85rem' }}>Plan</th>
                                <th className="py-3" style={{ color: '#915200', textTransform: 'uppercase', fontSize: '0.85rem' }}>Total Amount</th>
                                <th className="py-3" style={{ color: '#915200', textTransform: 'uppercase', fontSize: '0.85rem', minWidth: '150px' }}>Paid Progress</th>
                                <th className="py-3" style={{ color: '#915200', textTransform: 'uppercase', fontSize: '0.85rem' }}>Balance</th>
                                <th className="py-3 pe-4" style={{ color: '#915200', textTransform: 'uppercase', fontSize: '0.85rem' }}>Pending Dues</th>
                                <th className="py-3 pe-4" style={{ color: '#915200', textTransform: 'uppercase', fontSize: '0.85rem' }}>Status</th>
                                <th className="py-3 pe-4" style={{ color: '#915200', textTransform: 'uppercase', fontSize: '0.85rem' }}>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredSubscribers.map((item, index) => {
                                const percentage = Math.round((item.subscription.installmentsPaid / item.plan.durationMonths) * 100);
                                const remainingBalance = item.plan.totalAmount - item.subscription.totalAmountPaid;
                                const nextDueAmount = item.plan.monthlyAmount;

                                // Calculate missed months / logic if needed. 
                                // For now assuming pendingAmount > 0 implies at least 1 month due.
                                const monthsDueCount = item.subscription.pendingAmount > 0
                                    ? Math.ceil(item.subscription.pendingAmount / item.plan.monthlyAmount)
                                    : 0;

                                const isHighlighted = highlightedUser && (item.user._id === highlightedUser);

                                return (
                                    <tr key={index} style={{
                                        verticalAlign: 'middle',
                                        backgroundColor: isHighlighted ? '#fff8e6' : 'transparent', // Brand highlight color
                                        transition: 'background-color 0.5s ease'
                                    }}>
                                        <td className="ps-4 py-3">
                                            <div className="d-flex align-items-center">
                                                <div className="rounded-circle d-flex align-items-center justify-content-center me-3 bg-light border"
                                                    style={{ width: '40px', height: '40px' }}>
                                                    {item.user.profileImage ?
                                                        <img
                                                            src={`${BASEURL}${item.user.profileImage.startsWith('/') ? '' : '/'}${item.user.profileImage}`}
                                                            alt=""
                                                            className="rounded-circle"
                                                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                                            onError={onError}
                                                        /> :
                                                        <span className="fw-bold" style={{ color: '#915200' }}>{item.user.name?.charAt(0)}</span>
                                                    }
                                                </div>
                                                <div>
                                                    <div className="fw-bold text-dark">{item.user.name}</div>
                                                    <div className="small text-muted">{item.user.phone}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="fw-bold text-dark">
                                            {item.plan.planName}
                                            <div className="small text-muted fw-normal">{item.plan.durationMonths} Months</div>
                                        </td>
                                        <td className="fw-bold text-secondary">
                                            ₹{Number(item.plan.totalAmount).toFixed(2)}
                                        </td>
                                        <td>
                                            <div className="d-flex justify-content-between small mb-1">
                                                <span style={{ fontSize: '0.75rem' }}>₹{Number(item.subscription.totalAmountPaid).toFixed(2)} Paid</span>
                                                <span className="fw-bold text-success" style={{ fontSize: '0.75rem' }}>{percentage}%</span>
                                            </div>
                                            <ProgressBar
                                                now={percentage}
                                                variant="success"
                                                style={{ height: '6px', borderRadius: '10px' }}
                                            />
                                        </td>
                                        <td className="fw-bold text-warning" style={{ color: '#fd7e14' }}>
                                            ₹{Number(remainingBalance).toFixed(2)}
                                        </td>
                                        <td className="pe-4">
                                            {item.subscription.pendingAmount > 0 ? (
                                                <div className="d-flex align-items-center">
                                                    <Badge bg="danger" className="me-2 px-2 py-1">
                                                        {monthsDueCount} Month{monthsDueCount > 1 ? 's' : ''} Due
                                                    </Badge>
                                                    <span className="fw-bold text-danger">₹{Number(nextDueAmount).toFixed(2)}/mon</span>
                                                </div>
                                            ) : (
                                                <Badge bg="success" className="px-2 py-1">
                                                    <i className="fas fa-check me-1"></i>Up-to-Date
                                                </Badge>
                                            )}
                                        </td>
                                        <td className="pe-4">
                                            <Badge bg={
                                                item.subscription.status === 'active' ? 'primary' :
                                                    item.subscription.status === 'completed' ? 'success' :
                                                        item.subscription.status === 'settled' ? 'success' :
                                                            item.subscription.status === 'requested_withdrawal' ? 'warning' :
                                                                'secondary'
                                            } className="px-2 py-1">
                                                {item.subscription.status ? item.subscription.status.toUpperCase() : 'ACTIVE'}
                                            </Badge>
                                        </td>
                                        <td>
                                            <div className="d-flex align-items-center gap-2">
                                                <Button
                                                    size="sm"
                                                    onClick={() => openHistoryModal(item)}
                                                    title="View History"
                                                    style={{
                                                        border: '1px solid #915200',
                                                        color: '#915200',
                                                        backgroundColor: 'transparent'
                                                    }}
                                                    onMouseOver={(e) => {
                                                        e.currentTarget.style.backgroundColor = '#915200';
                                                        e.currentTarget.style.color = '#fff';
                                                    }}
                                                    onMouseOut={(e) => {
                                                        e.currentTarget.style.backgroundColor = 'transparent';
                                                        e.currentTarget.style.color = '#915200';
                                                    }}
                                                >
                                                    <i className="fas fa-history"></i>
                                                </Button>

                                                <Button
                                                    size="sm"
                                                    disabled={remainingBalance <= 0}
                                                    onClick={() => openManualPaymentModal(item)}
                                                    title="Paid Offline"
                                                    style={{
                                                        border: '1px solid #915200',
                                                        color: remainingBalance <= 0 ? '#ccc' : '#915200',
                                                        backgroundColor: 'transparent',
                                                        opacity: remainingBalance <= 0 ? 0.5 : 1
                                                    }}
                                                    onMouseOver={(e) => {
                                                        if (remainingBalance > 0) {
                                                            e.currentTarget.style.backgroundColor = '#915200';
                                                            e.currentTarget.style.color = '#fff';
                                                        }
                                                    }}
                                                    onMouseOut={(e) => {
                                                        if (remainingBalance > 0) {
                                                            e.currentTarget.style.backgroundColor = 'transparent';
                                                            e.currentTarget.style.color = '#915200';
                                                        }
                                                    }}
                                                >
                                                    <i className="fas fa-hand-holding-usd"></i>
                                                </Button>
                                            </div>
                                        </td>

                                    </tr>
                                );
                            })}
                        </tbody>
                    </Table>
                )}
            </Card>
            {/* Confirmation Modal */}
            <Modal show={confirmModal.show} onHide={closeConfirmModal} centered>
                <Modal.Header closeButton className="border-0 pb-0">
                    <Modal.Title className="fw-bold" style={{ color: '#915200' }}>
                        {confirmModal.title}
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body className="py-4">
                    <p className="mb-0 text-muted">{confirmModal.message}</p>
                </Modal.Body>
                <Modal.Footer className="border-0 pt-0">
                    <Button variant="outline-secondary" onClick={closeConfirmModal} className="px-4 rounded-pill">
                        Cancel
                    </Button>
                    <Button
                        style={{ backgroundColor: '#915200', borderColor: '#915200' }}
                        onClick={confirmModal.onConfirm}
                        className="px-4 rounded-pill fw-bold"
                    >
                        Confirm
                    </Button>
                </Modal.Footer>
            </Modal>

            {/* Processing Overlay Modal */}
            <Modal show={!!actionLoading || submittingManual} centered backdrop="static" keyboard={false} size="sm">
                <Modal.Body className="text-center p-4">
                    <div className="spinner-border mb-3" role="status" style={{ color: '#915200' }}>
                        <span className="visually-hidden">Loading...</span>
                    </div>
                    <h5 className="fw-bold" style={{ color: '#915200' }}>Please Wait</h5>
                    <p className="text-muted mb-0 small">Processing and sending notification emails...</p>
                </Modal.Body>
            </Modal>

            {/* Manual Payment Modal */}
            <Modal show={manualPaymentModal} onHide={() => setManualPaymentModal(false)} centered size="md">
                <Modal.Header closeButton style={{ borderBottom: '2px solid #f3e9bd', backgroundColor: '#fffbf0' }}>
                    <Modal.Title className="d-flex align-items-center" style={{ color: '#915200' }}>
                        <i className="fas fa-money-bill-wave me-2"></i>
                        Record Offline Payment
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body style={{ padding: '2rem' }}>
                    {selectedSubscriber && (
                        <>
                            {/* User Info Card */}
                            <div className="mb-4 p-3 rounded-3 border" style={{ backgroundColor: '#f8f9fa' }}>
                                <div className="d-flex align-items-center mb-3">
                                    <div className="rounded-circle d-flex align-items-center justify-content-center me-3 border"
                                        style={{ width: '50px', height: '50px', backgroundColor: '#fff' }}>
                                        {selectedSubscriber.user.profileImage ? (
                                            <img
                                                src={`${BASEURL}${selectedSubscriber.user.profileImage.startsWith('/') ? '' : '/'}${selectedSubscriber.user.profileImage}`}
                                                alt=""
                                                className="rounded-circle"
                                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                                onError={onError}
                                            />
                                        ) : (
                                            <span className="fw-bold fs-4" style={{ color: '#915200' }}>
                                                {selectedSubscriber.user.name?.charAt(0)}
                                            </span>
                                        )}
                                    </div>
                                    <div>
                                        <div className="fw-bold text-dark fs-5">{selectedSubscriber.user.name}</div>
                                        <div className="small text-muted">
                                            <i className="fas fa-phone me-1"></i>
                                            {selectedSubscriber.user.phone}
                                        </div>
                                    </div>
                                </div>
                                <div className="d-flex align-items-center">
                                    <i className="fas fa-gem me-2" style={{ color: '#915200' }}></i>
                                    <span className="fw-bold" style={{ color: '#915200' }}>
                                        {selectedSubscriber.plan.planName}
                                    </span>
                                    <span className="ms-2 small text-muted">
                                        ({selectedSubscriber.plan.durationMonths} months)
                                    </span>
                                </div>
                            </div>

                            {/* Amount Input */}
                            <div className="mb-3">
                                <label className="form-label fw-bold text-dark">
                                    <i className="fas fa-rupee-sign me-2" style={{ color: '#915200' }}></i>
                                    Payment Amount
                                </label>
                                <div className="input-group">
                                    <span className="input-group-text" style={{ backgroundColor: '#fffbf0', borderColor: '#915200', color: '#915200' }}>
                                        ₹
                                    </span>
                                    <input
                                        type="number"
                                        className="form-control"
                                        value={manualForm.amount}
                                        onChange={(e) => setManualForm({ ...manualForm, amount: e.target.value })}
                                        style={{ borderColor: '#915200', fontSize: '1.1rem', fontWeight: '600' }}
                                        placeholder="Enter amount"
                                    />
                                </div>
                                <small className="text-muted">
                                    Suggested: ₹{selectedSubscriber.plan.monthlyAmount.toFixed(2)} (Monthly installment)
                                </small>
                            </div>

                            {/* Notes Input */}
                            <div className="mb-3">
                                <label className="form-label fw-bold text-dark">
                                    <i className="fas fa-sticky-note me-2" style={{ color: '#915200' }}></i>
                                    Payment Notes
                                </label>
                                <textarea
                                    className="form-control"
                                    rows="3"
                                    placeholder="E.g. Paid in cash at shop, Bank transfer..."
                                    value={manualForm.notes}
                                    onChange={(e) => setManualForm({ ...manualForm, notes: e.target.value })}
                                    style={{ borderColor: '#915200' }}
                                ></textarea>
                                <small className="text-muted">
                                    <i className="fas fa-info-circle me-1"></i>
                                    Add details about how the payment was received
                                </small>
                            </div>
                        </>
                    )}
                </Modal.Body>
                <Modal.Footer style={{ borderTop: '2px solid #f3e9bd', backgroundColor: '#fffbf0' }}>
                    <Button
                        variant="outline-secondary"
                        onClick={() => setManualPaymentModal(false)}
                        className="px-4"
                    >
                        <i className="fas fa-times me-2"></i>Cancel
                    </Button>

                    <Button
                        style={{ background: 'linear-gradient(90deg, #915200 0%, #d4af37 100%)', border: 'none' }}
                        onClick={submitManualPayment}
                        disabled={submittingManual}
                        className="px-5 fw-bold rounded-pill shadow-sm"
                    >
                        {submittingManual ? (
                            <>
                                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                Recording...
                            </>
                        ) : (
                            <>
                                <i className="fas fa-check-circle me-2"></i>
                                Record Payment
                            </>
                        )}
                    </Button>
                </Modal.Footer>
            </Modal>

            {/* Offline Payment Details Modal */}
            <Modal show={offlineDetailsModal.show} onHide={() => setOfflineDetailsModal({ show: false, payment: null })} centered size="lg">
                <Modal.Header closeButton className="border-0 pb-0">
                    <Modal.Title className="fw-bold fs-5" style={{ color: '#915200' }}>
                        <i className="fas fa-file-invoice-dollar me-2"></i> Payment Details
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body className="p-4">
                    {offlineDetailsModal.payment && (
                        <div className="row">
                            <div className="col-md-6 border-end">
                                <h6 className="text-uppercase text-muted small fw-bold mb-3">User Information</h6>
                                <div className="d-flex align-items-center mb-4">
                                    <div className="rounded-circle d-flex align-items-center justify-content-center me-3 border shadow-sm"
                                        style={{ width: '60px', height: '60px', backgroundColor: '#fff' }}>
                                        {offlineDetailsModal.payment.user?.profileImage ? (
                                            <img
                                                src={`${BASEURL}${offlineDetailsModal.payment.user.profileImage.startsWith('/') ? '' : '/'}${offlineDetailsModal.payment.user.profileImage}`}
                                                alt=""
                                                className="rounded-circle"
                                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                                onError={onError}
                                            />
                                        ) : (
                                            <span className="fw-bold fs-3 text-secondary">
                                                {offlineDetailsModal.payment.user?.name?.charAt(0)}
                                            </span>
                                        )}
                                    </div>
                                    <div>
                                        <h5 className="mb-1 fw-bold text-dark">{offlineDetailsModal.payment.user?.name}</h5>
                                        <div className="text-muted small"><i className="fas fa-phone me-1"></i>{offlineDetailsModal.payment.user?.phone}</div>
                                    </div>
                                </div>

                                <h6 className="text-uppercase text-muted small fw-bold mb-3">Transaction Info</h6>
                                <div className="p-3 bg-light rounded-3 mb-3">
                                    <div className="d-flex justify-content-between mb-2">
                                        <span className="text-muted">Amount</span>
                                        <span className="fw-bold text-success fs-5">₹{offlineDetailsModal.payment.amount}</span>
                                    </div>
                                    <div className="d-flex justify-content-between mb-2">
                                        <span className="text-muted">Date</span>
                                        <span className="fw-bold text-dark">{new Date(offlineDetailsModal.payment.paymentDate).toLocaleDateString()}</span>
                                    </div>
                                    <div className="d-flex justify-content-between">
                                        <span className="text-muted">Plan</span>
                                        <span className="fw-bold text-dark">{offlineDetailsModal.payment.chitPlan?.planName}</span>
                                    </div>
                                </div>

                                <div className="mb-3">
                                    <label className="text-uppercase text-muted small fw-bold mb-1">Notes</label>
                                    <div className="p-3 border rounded bg-white text-muted fst-italic">
                                        {offlineDetailsModal.payment.notes || "No notes provided."}
                                    </div>
                                </div>
                            </div>
                            <div className="col-md-6">
                                <h6 className="text-uppercase text-muted small fw-bold mb-3">Payment Proof</h6>
                                {offlineDetailsModal.payment.proofImage ? (
                                    <div className="text-center bg-light rounded-3 p-2 border" style={{ minHeight: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <img
                                            src={`${BASEURL}${offlineDetailsModal.payment.proofImage}`}
                                            alt="Proof"
                                            className="img-fluid rounded shadow-sm"
                                            style={{ maxHeight: '400px', objectFit: 'contain' }}
                                            onError={(e) => { e.target.src = 'https://via.placeholder.com/400x300?text=Image+Not+Found'; }}
                                        />
                                    </div>
                                ) : (
                                    <div className="text-center p-5 border rounded-3 bg-light text-muted">
                                        <i className="fas fa-image-slash fa-3x mb-3 opacity-50"></i>
                                        <p>No proof image uploaded.</p>
                                    </div>
                                )}
                                {offlineDetailsModal.payment.proofImage && (
                                    <div className="text-center mt-3">
                                        <a href={`${BASEURL}${offlineDetailsModal.payment.proofImage}`} target="_blank" rel="noreferrer" className="btn btn-outline-primary btn-sm rounded-pill">
                                            <i className="fas fa-external-link-alt me-1"></i> Open Full Image
                                        </a>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </Modal.Body>
                <Modal.Footer className="border-0 pt-0">
                    <Button variant="secondary" onClick={() => setOfflineDetailsModal({ show: false, payment: null })} className="rounded-pill px-4">
                        <i className="fas fa-times me-2"></i> Close
                    </Button>
                    {offlineDetailsModal.payment && (
                        <>
                            <Button
                                variant="danger"
                                className="rounded-pill px-4"
                                onClick={() => {
                                    setOfflineDetailsModal({ show: false, payment: null });
                                    handleReject(offlineDetailsModal.payment._id);
                                }}
                            >
                                <i className="fas fa-times me-2"></i> Reject
                            </Button>
                            <Button
                                variant="success"
                                className="rounded-pill px-4"
                                onClick={() => {
                                    setOfflineDetailsModal({ show: false, payment: null });
                                    handleApprove(offlineDetailsModal.payment._id);
                                }}
                            >
                                <i className="fas fa-check me-2"></i> Approve
                            </Button>
                        </>
                    )}
                </Modal.Footer>
            </Modal>

            {/* Unified Success Modal */}
            <Modal show={successModal.show} onHide={() => setSuccessModal({ ...successModal, show: false })} centered>
                <Modal.Body className="text-center p-5">
                    <div className="mx-auto rounded-circle d-flex align-items-center justify-content-center mb-4"
                        style={{ width: '80px', height: '80px', backgroundColor: '#fffbf0', color: '#915200', border: '2px solid #f3e9bd' }}>
                        <i className="fas fa-check fa-3x"></i>
                    </div>

                    <h4 className="fw-bold mb-3" style={{ color: '#915200' }}>{successModal.title}</h4>
                    <p className="text-muted mb-4">{successModal.message}</p>

                    <div className="d-grid gap-3 col-10 mx-auto">
                        <Button
                            variant="outline-light"
                            onClick={() => {
                                generateInvoice(successModal.payment, successModal.subscriber);
                                setSuccessModal({ ...successModal, show: false });
                            }}
                            className="fw-bold py-2"
                            style={{ borderColor: '#915200', color: '#915200' }}
                            onMouseOver={(e) => { e.currentTarget.style.backgroundColor = '#915200'; e.currentTarget.style.color = '#fff'; }}
                            onMouseOut={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#915200'; }}
                        >
                            <i className="fas fa-file-invoice me-2"></i>Download Invoice
                        </Button>

                        <Button
                            onClick={() => setSuccessModal({ ...successModal, show: false })}
                            className="fw-bold py-2"
                            style={{ backgroundColor: '#915200', borderColor: '#915200' }}
                        >
                            Close
                        </Button>
                    </div>
                </Modal.Body>
            </Modal>

            {/* History Details Modal */}
            <Modal show={showHistoryModal} onHide={() => setShowHistoryModal(false)} centered size="xl">
                <Modal.Header closeButton style={{ borderBottom: '2px solid #f3e9bd' }}>
                    <Modal.Title style={{ color: '#915200' }}>
                        <i className="fas fa-history me-2"></i> Subscription History
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body className="p-0" style={{ backgroundColor: '#fffbf0', overflow: 'hidden' }}>
                    {selectedSubscriber && (
                        <div className="row g-0">
                            {/* Left Column: Details (Fixed/Static) */}
                            <div className="col-md-4 border-end bg-white">
                                <div className="p-4" style={{ height: '100%', overflowY: 'auto', maxHeight: '70vh' }}>
                                    <h6 className="fw-bold mb-4" style={{ color: '#915200', letterSpacing: '1px', fontSize: '0.8rem' }}>SUBSCRIBER DETAILS</h6>

                                    <div className="text-center mb-4">
                                        <div className="rounded-circle d-flex align-items-center justify-content-center mx-auto mb-3 shadow-sm"
                                            style={{ width: '90px', height: '90px', backgroundColor: '#fffbf0', border: '2px solid #915200' }}>
                                            {selectedSubscriber.user.profileImage ? (
                                                <img src={`${BASEURL}${selectedSubscriber.user.profileImage}`} className="rounded-circle w-100 h-100" style={{ objectFit: 'cover' }} alt="" onError={onError} />
                                            ) : (
                                                <span className="display-6 fw-bold" style={{ color: '#915200' }}>{selectedSubscriber.user.name?.charAt(0)}</span>
                                            )}
                                        </div>
                                        <h5 className="fw-bold text-dark mb-1">{selectedSubscriber.user.name}</h5>
                                        <div className="text-muted"><i className="fas fa-phone me-1" style={{ color: '#915200' }}></i>{selectedSubscriber.user.phone}</div>
                                    </div>

                                    <div className="card border-0 mb-3" style={{ backgroundColor: '#fffbf0' }}>
                                        <div className="card-body">
                                            <div className="mb-3">
                                                <small className="text-muted d-block uppercase" style={{ fontSize: '0.7rem' }}>EMAIL ID</small>
                                                <span className="fw-bold" style={{ wordBreak: 'break-all', color: '#915200' }}>{selectedSubscriber.user.email || '-'}</span>
                                            </div>
                                            <div className="mb-3">
                                                <small className="text-muted d-block uppercase" style={{ fontSize: '0.7rem' }}>FULL ADDRESS</small>
                                                <span className="fw-bold" style={{ color: '#915200' }}>
                                                    {selectedSubscriber.user.address || selectedSubscriber.user.city || 'Address Not Provided'}
                                                </span>
                                            </div>
                                            <div>
                                                <small className="text-muted d-block uppercase" style={{ fontSize: '0.7rem' }}>JOINED DATE</small>
                                                <span className="fw-bold" style={{ color: '#915200' }}>{new Date(selectedSubscriber.subscription.joinedAt).toLocaleDateString()}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <h6 className="fw-bold mb-3 mt-4" style={{ color: '#915200', letterSpacing: '1px', fontSize: '0.8rem' }}>PLAN SUMMARY</h6>
                                    <div className="card border-0 shadow-sm rounded-3 overflow-hidden" style={{ borderLeft: '4px solid #915200' }}>
                                        <div className="card-body">
                                            <div className="d-flex justify-content-between mb-2">
                                                <span className="text-muted">Plan Name</span>
                                                <span className="fw-bold" style={{ color: '#915200' }}>{selectedSubscriber.plan.planName}</span>
                                            </div>
                                            <div className="d-flex justify-content-between mb-2">
                                                <span className="text-muted">Duration</span>
                                                <span className="fw-bold text-dark">{selectedSubscriber.plan.durationMonths} Months</span>
                                            </div>
                                            <hr className="my-2" style={{ borderColor: '#f3e9bd' }} />
                                            <div className="d-flex justify-content-between mb-2">
                                                <span className="text-muted">Total Paid</span>
                                                <span className="fw-bold" style={{ color: '#915200' }}>₹{selectedSubscriber.subscription.totalAmountPaid}</span>
                                            </div>
                                            <div className="d-flex justify-content-between mb-2">
                                                <span className="text-muted">Pending</span>
                                                <span className="fw-bold text-muted">₹{selectedSubscriber.plan.totalAmount - selectedSubscriber.subscription.totalAmountPaid}</span>
                                            </div>
                                            <div className="mt-3 text-center">
                                                <Badge bg="light" className="px-3 py-2 rounded-pill border" style={{ color: '#915200', borderColor: '#915200' }}>
                                                    {selectedSubscriber.subscription.status?.toUpperCase() || 'ACTIVE'}
                                                </Badge>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Right Column: Payment History (Scrollable) */}
                            <div className="col-md-8">
                                <div className="p-4" style={{ height: '70vh', overflowY: 'auto' }}>
                                    <div className="d-flex justify-content-between align-items-center mb-3">
                                        <h6 className="fw-bold mb-0" style={{ color: '#915200', letterSpacing: '1px', fontSize: '0.8rem' }}>PAYMENT HISTORY (A-Z)</h6>
                                        <div className="d-flex gap-2">
                                            <Button
                                                size="sm"
                                                variant="outline-dark"
                                                onClick={() => generateStatement(selectedSubscriber, paymentHistory)}
                                                className="py-1 px-3 rounded-pill"
                                                style={{ fontSize: '0.75rem', borderColor: '#915200', color: '#915200' }}
                                                onMouseOver={(e) => { e.currentTarget.style.backgroundColor = '#915200'; e.currentTarget.style.color = 'white'; }}
                                                onMouseOut={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#915200'; }}
                                            >
                                                <i className="fas fa-file-download me-1"></i><span className='fw-bold'>Download Statement</span>
                                            </Button>
                                            <Badge bg="light" pill style={{ color: '#915200', borderColor: '#915200', borderWidth: '1px', borderStyle: 'solid', display: 'flex', alignItems: 'center' }}>
                                                Total: {paymentHistory.length}
                                            </Badge>
                                        </div>
                                    </div>

                                    {loadingHistory ? (
                                        <div className="p-3">
                                            {[1, 2, 3].map((i) => (
                                                <div key={i} className="mb-3 p-3 border rounded bg-white">
                                                    <div className="d-flex justify-content-between mb-2">
                                                        <div className="bg-light rounded" style={{ width: '30%', height: '20px' }}></div>
                                                        <div className="bg-light rounded" style={{ width: '20%', height: '20px' }}></div>
                                                    </div>
                                                    <div className="bg-light rounded" style={{ width: '60%', height: '15px' }}></div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : paymentHistory.length === 0 ? (
                                        <div className="text-center p-5 text-muted border rounded bg-white mt-4">
                                            <i className="fas fa-receipt fa-3x mb-3 opacity-25" style={{ color: '#915200' }}></i>
                                            <p>No payment history found.</p>
                                        </div>
                                    ) : (
                                        <div className="table-responsive rounded shadow-sm border">
                                            <Table hover className="mb-0 bg-white small align-middle">
                                                <thead className="sticky-top" style={{ top: 0, zIndex: 1, backgroundColor: '#fffbf0' }}>
                                                    <tr>
                                                        <th className="py-3 ps-3" style={{ color: '#915200' }}>Date</th>
                                                        <th className="py-3" style={{ color: '#915200' }}>Amount</th>
                                                        <th className="py-3" style={{ color: '#915200' }}>Type</th>
                                                        <th className="py-3" style={{ color: '#915200' }}>Status</th>
                                                        <th className="py-3 pe-3" style={{ color: '#915200' }}>Action</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {paymentHistory.map((pay) => (
                                                        <tr key={pay._id}>
                                                            <td className="ps-3 py-2 text-nowrap">
                                                                <div className="fw-bold text-dark">{new Date(pay.paymentDate || pay.createdAt).toLocaleDateString()}</div>
                                                                <div className="small text-muted">{new Date(pay.paymentDate || pay.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                                                            </td>
                                                            <td className="py-2">
                                                                <div className="fw-bold" style={{ color: '#915200' }}>₹{pay.amount}</div>
                                                                {pay.commissionAmount > 0 && (
                                                                    <div className="text-muted" style={{ fontSize: '0.7rem' }}>
                                                                        + ₹{pay.commissionAmount} (Platform Fee)
                                                                    </div>
                                                                )}
                                                            </td>
                                                            <td className="py-2">
                                                                {pay.type === 'offline' ?
                                                                    <Badge bg="light" className="border" style={{ color: '#915200', borderColor: '#915200' }}>
                                                                        <i className="fas fa-hand-holding-usd me-1"></i>Offline
                                                                    </Badge> :
                                                                    <Badge bg="light" className="border" style={{ color: '#915200', borderColor: '#915200' }}>
                                                                        <i className="fas fa-globe me-1"></i>Online
                                                                    </Badge>
                                                                }
                                                                {pay.commissionAmount > 0 && (
                                                                    <Badge bg="info" className="ms-1" style={{ fontSize: '0.6rem' }}>Fee Paid</Badge>
                                                                )}
                                                            </td>
                                                            <td className="py-2">
                                                                <Badge bg="transparent" className="border" style={{
                                                                    color: pay.status === 'Completed' ? '#915200' : '#888',
                                                                    borderColor: pay.status === 'Completed' ? '#915200' : '#ccc',
                                                                    backgroundColor: pay.status === 'Completed' ? '#fffbf0' : '#f8f9fa'
                                                                }}>
                                                                    {pay.status}
                                                                </Badge>
                                                            </td>
                                                            <td className="py-2 pe-3">
                                                                {pay.status === 'Completed' && (
                                                                    <OverlayTrigger
                                                                        placement="top"
                                                                        overlay={<Tooltip>Download Receipt</Tooltip>}
                                                                    >
                                                                        <Button
                                                                            variant="link"
                                                                            size="sm"
                                                                            onClick={() => generateInvoice(pay, selectedSubscriber)}
                                                                            className="p-0 text-decoration-none"
                                                                            style={{ color: '#915200' }}
                                                                        >
                                                                            <i className="fas fa-cloud-download-alt"></i>
                                                                        </Button>
                                                                    </OverlayTrigger>
                                                                )}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </Table>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </Modal.Body>
                <Modal.Footer className="bg-light border-top-0 py-2">
                    <Button variant="secondary" size="sm" onClick={() => setShowHistoryModal(false)}>Close</Button>
                </Modal.Footer>
            </Modal>
            {/* Settlement Modal */}
            <Modal show={settlementModal.show} onHide={() => setSettlementModal({ show: false, subscriber: null })} centered>
                <Modal.Header closeButton>
                    <Modal.Title className="fw-bold" style={{ color: '#915200' }}>Settle Withdrawal</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {settlementModal.subscriber && (
                        <div>
                            <p>Settle funds for <strong>{settlementModal.subscriber.user.name}</strong>.</p>
                            <div className="alert alert-warning py-2 border-0" style={{ backgroundColor: '#FFF8E1', color: '#856404' }}>
                                Total Saved: <strong>₹{settlementModal.subscriber.subscription.totalAmountPaid}</strong>
                            </div>

                            <div className="mb-3">
                                <label className="form-label small fw-bold">Settlement Amount (₹)</label>
                                <input
                                    type="number"
                                    className="form-control"
                                    disabled
                                    value={settlementForm.amount}
                                    onChange={(e) => setSettlementForm({ ...settlementForm, amount: e.target.value })}
                                />
                            </div>

                            <div className="mb-3">
                                <label className="form-label small fw-bold">Transaction ID / Reference</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    value={settlementForm.transactionId}
                                    onChange={(e) => setSettlementForm({ ...settlementForm, transactionId: e.target.value })}
                                    placeholder="UPI Ref, Cheque No, etc."
                                />
                            </div>

                            <div className="mb-3">
                                <label className="form-label small fw-bold">Notes</label>
                                <textarea
                                    className="form-control"
                                    rows="2"
                                    value={settlementForm.note}
                                    onChange={(e) => setSettlementForm({ ...settlementForm, note: e.target.value })}
                                ></textarea>
                            </div>
                        </div>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setSettlementModal({ show: false, subscriber: null })}>Cancel</Button>
                    <Button
                        variant="primary"
                        onClick={executeSettlement}
                        disabled={submittingSettlement}
                        style={{ backgroundColor: '#915200', borderColor: '#915200' }}
                    >
                        {submittingSettlement ? 'Processing...' : 'Confirm Settlement'}
                    </Button>
                </Modal.Footer>
            </Modal>
        </div>
    );
};

export default MerchantSubscribers;
