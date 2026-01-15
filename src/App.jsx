import React, { useState, useEffect, useRef } from 'react';
import { toPng } from 'html-to-image';

const App = () => {
  const captureRef = useRef(null);
  const [imgUrl, setImgUrl] = useState(null);
  const [currentDate, setCurrentDate] = useState(null);
  
  // 1. Parse URL Parameters (HTTP GET Request Style)
  // Default values match the user's original hardcoded values (iPhone resolution)
  const params = new URLSearchParams(window.location.search);
  const width = parseInt(params.get('width')) || 1220;
  const height = parseInt(params.get('height')) || 2712;
  const themeColor = params.get('color') ? `#${params.get('color')}` : '#ff5722';
  
  // Dynamically calculate padding to maintain the "Lock Screen" ratio 
  // (Original was 800px padding for 2712px height ~ 29.5%)
  const paddingTop = Math.round(height * 0.295);

  // 2. Get IST Time
  useEffect(() => {
    const now = new Date();
    const utc = now.getTime() + now.getTimezoneOffset() * 60000;
    const istOffset = 5.5 * 60 * 60000;
    setCurrentDate(new Date(utc + istOffset));
  }, []);

  // 3. Auto-Generate Image
  useEffect(() => {
    if (currentDate && captureRef.current && !imgUrl) {
      // Delay to ensure fonts and layout are stable
      setTimeout(() => {
        toPng(captureRef.current, {
          width: width,
          height: height,
          pixelRatio: 1,
          style: { transform: 'none' }
        })
        .then((dataUrl) => setImgUrl(dataUrl))
        .catch((err) => console.error(err));
      }, 500); 
    }
  }, [currentDate, imgUrl, width, height]);

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
    // Dynamic Container Sizing
    captureContainer: {
      width: `${width}px`,
      height: `${height}px`,
      backgroundColor: '#161616',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'flex-start', 
      paddingTop: `${paddingTop}px`, // Dynamic padding
      fontFamily: 'sans-serif',
      boxSizing: 'border-box',
    },
    // Scale wrapper based on width relative to original 1220px to prevent layout break
    wrapper: { 
      width: '100%', 
      maxWidth: '85%', // Use percentage for better flexibility
      transform: width < 1000 ? `scale(${width / 1220})` : 'none',
      transformOrigin: 'top center'
    },
    grid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(3, 1fr)',
      columnGap: `${width * 0.05}px`, // Relative gap
      rowGap: `${height * 0.025}px`, // Relative gap
    },
    monthBox: { display: 'flex', flexDirection: 'column', gap: '15px' },
    monthTitle: { color: '#888', fontSize: '32px', margin: 0, fontWeight: '500' },
    daysGrid: { display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '12px' },
    dot: { width: '20px', height: '20px', borderRadius: '50%' },
    dotFuture: { backgroundColor: '#333' },
    dotPast: { backgroundColor: '#e0e0e0' },
    dotCurrent: { backgroundColor: themeColor, boxShadow: `0 0 15px ${themeColor}` },
    footer: { marginTop: '100px', textAlign: 'center', fontSize: '48px', color: '#666', fontWeight: '500' }
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
              <span style={{color: themeColor}}>{daysLeft}d left</span> · {percentageLeft}%
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
            display: 'block',
            boxShadow: '0 0 50px rgba(0,0,0,0.5)' // Added shadow for presentation
          }} 
        />
      ) : (
        // Loading state matching the background
        <div style={{width: '100vw', height: '100vh', background: '#161616', display:'flex', justifyContent:'center', alignItems:'center', color:'#333'}}>
           Generating...
        </div>
      )}
    </div>
  );
};

export default App;
