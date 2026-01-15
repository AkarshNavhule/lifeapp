import React, { useState, useEffect, useRef } from 'react';
import { toPng } from 'html-to-image';

const App = () => {
  const captureRef = useRef(null);
  const [imgUrl, setImgUrl] = useState(null);
  const [currentDate, setCurrentDate] = useState(null);

  // 1. Get IST Time
  useEffect(() => {
    const now = new Date();
    const utc = now.getTime() + now.getTimezoneOffset() * 60000;
    const istOffset = 5.5 * 60 * 60000;
    setCurrentDate(new Date(utc + istOffset));
  }, []);

  // 2. Auto-Generate Image
  useEffect(() => {
    if (currentDate && captureRef.current && !imgUrl) {
      setTimeout(() => {
        toPng(captureRef.current, {
          width: 1220,
          height: 2712,
          pixelRatio: 1,
          style: { transform: 'none' }
        })
        .then((dataUrl) => setImgUrl(dataUrl))
        .catch((err) => console.error(err));
      }, 500); // 500ms delay to ensure fonts are loaded
    }
  }, [currentDate, imgUrl]);



  // --- CALENDAR DATA ---
  const getMonthData = (year, month) => {
    const date = new Date(year, month, 1);
    const days = [];
    const firstDayOfWeek = date.getDay(); 
    for (let i = 0; i < firstDayOfWeek; i++) days.push(null);
    while (date.getMonth() === month) {
      days.push(new Date(date));
      date.setDate(date.getDate() + 1);
    }
    return days;
  };

  if (!currentDate) return null;

  const currentYear = currentDate.getFullYear();
  const currentMonthIndex = currentDate.getMonth();
  const currentDay = currentDate.getDate();
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  
  const endOfYear = new Date(currentYear, 11, 31);
  const daysLeft = Math.ceil((endOfYear - currentDate) / (1000 * 60 * 60 * 24));
  const totalDaysInYear = (currentYear % 4 === 0 && currentYear % 100 !== 0) || currentYear % 400 === 0 ? 366 : 365;
  const percentageLeft = Math.round((daysLeft / totalDaysInYear) * 100);

  // --- STYLES ---
  const styles = {
    // Hidden Capture Container
    captureContainer: {
      width: '1220px',
      height: '2712px',
      backgroundColor: '#161616',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'flex-start', 
      paddingTop: '800px', // Keeps your custom vertical offset
      fontFamily: 'sans-serif',
      boxSizing: 'border-box',
    },
    wrapper: { width: '100%', maxWidth: '1000px' },
    grid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(3, 1fr)',
      columnGap: '60px',
      rowGap: '70px',
    },
    monthBox: { display: 'flex', flexDirection: 'column', gap: '20px' },
    monthTitle: { color: '#888', fontSize: '32px', margin: 0, fontWeight: '500' },
    daysGrid: { display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '14px' },
    dot: { width: '20px', height: '20px', borderRadius: '50%' },
    dotFuture: { backgroundColor: '#333' },
    dotPast: { backgroundColor: '#e0e0e0' },
    dotCurrent: { backgroundColor: '#ff5722', boxShadow: '0 0 15px #ff5722' },
    footer: { marginTop: '150px', textAlign: 'center', fontSize: '48px', color: '#666', fontWeight: '500' }
  };

  return (
    <div style={{ backgroundColor: '#161616', minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', margin: 0 }}>
      
      {/* HIDDEN SOURCE ELEMENT (Used for generation) */}
      <div style={{ position: 'fixed', top: -10000, left: -10000 }}>
        <div ref={captureRef} style={styles.captureContainer}>
          <div style={styles.wrapper}>
            <div style={styles.grid}>
              {monthNames.map((name, mIdx) => {
                const days = getMonthData(currentYear, mIdx);
                return (
                  <div key={name} style={styles.monthBox}>
                    <h3 style={styles.monthTitle}>{name}</h3>
                    <div style={styles.daysGrid}>
                      {days.map((d, i) => {
                        if (!d) return <div key={`e-${i}`} />;
                        const isPast = d.getMonth() < currentMonthIndex || (d.getMonth() === currentMonthIndex && d.getDate() < currentDay);
                        const isCurrent = d.getMonth() === currentMonthIndex && d.getDate() === currentDay;
                        
                        let dotStyle = { ...styles.dot, ...styles.dotFuture };
                        if (isPast) dotStyle = { ...styles.dot, ...styles.dotPast };
                        if (isCurrent) dotStyle = { ...styles.dot, ...styles.dotCurrent };
                        return <div key={i} style={dotStyle} />;
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
            <div style={styles.footer}>
              <span style={{color: '#ff5722'}}>{daysLeft}d left</span> · {percentageLeft}%
            </div>
          </div>
        </div>
      </div>

      {/* FINAL OUTPUT: Shows image and text if download fails */}
      {imgUrl ? (
        <img 
          src={imgUrl} 
          alt="Calendar" 
          style={{ 
            maxWidth: '100%', 
            maxHeight: '100vh', 
            display: 'block' 
          }} 
        />
      ) : (
        // Optional: Keep screen black while generating
        <div style={{width: '100vw', height: '100vh', background: '#161616'}} />
      )}
    </div>
  );
};

export default App;