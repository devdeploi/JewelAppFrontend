import { useEffect, useRef, useCallback } from 'react';

const useAutoLogout = (onLogout, timeout = 900000, isActive = true) => {
    const timerRef = useRef(null);
    const onLogoutRef = useRef(onLogout);

    // Keep the latest callback in a ref to avoid re-triggering the effect
    useEffect(() => {
        onLogoutRef.current = onLogout;
    }, [onLogout]);

    const resetTimer = useCallback(() => {
        if (timerRef.current) clearTimeout(timerRef.current);
        if (isActive) {
            timerRef.current = setTimeout(() => {
                if (onLogoutRef.current) onLogoutRef.current();
            }, timeout);
        }
    }, [isActive, timeout]);

    useEffect(() => {
        if (!isActive) {
            if (timerRef.current) clearTimeout(timerRef.current);
            return;
        }

        const events = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'];

        const handleActivity = () => {
            resetTimer();
        };

        // Add listeners
        events.forEach(event => {
            window.addEventListener(event, handleActivity);
        });

        // Initialize timer
        resetTimer();

        // Cleanup
        return () => {
            if (timerRef.current) clearTimeout(timerRef.current);
            events.forEach(event => {
                window.removeEventListener(event, handleActivity);
            });
        };
    }, [isActive, resetTimer]);
};

export default useAutoLogout;
