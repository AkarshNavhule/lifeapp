import React, { useState, useEffect, useRef } from 'react';
import { toPng } from 'html-to-image';

const App = () => {
  const captureRef = useRef(null);
  const [imgUrl, setImgUrl] = useState(null);
  const [currentDate, setCurrentDate] = useState(null);

  // 1. Set Time to Indian Standard Time (IST)
  useEffect(() => {
    const getISTDate = () => {
      const now = new Date();
      const utc = now.getTime() + now.getTimezoneOffset() * 60000;
      const istOffset = 5.5 * 60 * 60000; // IST is UTC + 5:30
      return new Date(utc + istOffset);
    };
    setCurrentDate(getISTDate());
  }, []);

  // 2. Convert to 1220x2712 PNG
  useEffect(() => {
    if (currentDate && captureRef.current && !imgUrl) {
      // Small delay to ensure fonts render
      setTimeout(() => {
        toPng(captureRef.current, {
          width: 1220,
          height: 2712,
          pixelRatio: 1, // Ensures 1:1 pixel mapping
          style: {
             // Force no transform on the captured element itself
             transform: 'none', 
          }
        })
        .then((dataUrl) => {
          setImgUrl(dataUrl);
        })
        .catch((err) => console.error('Error generating image:', err));
      }, 1000);
    }
  }, [currentDate, imgUrl]);

  // --- CALENDAR DATA LOGIC ---
  const getMonthData = (year, month) => {
    const date = new Date(year, month, 1);
    const days = [];
    const firstDayOfWeek = date.getDay(); // 0=Sun, 1=Mon...

    // Pad empty days
    for (let i = 0; i < firstDayOfWeek; i++) days.push(null);

    while (date.getMonth() === month) {
      days.push(new Date(date));
      date.setDate(date.getDate() + 1);
    }
    return days;
  };

  if (!currentDate) return <div style={{color:'white'}}>Initializing IST...</div>;

  const currentYear = currentDate.getFullYear();
  const currentMonthIndex = currentDate.getMonth();
  const currentDay = currentDate.getDate();
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  // Stats
  const endOfYear = new Date(currentYear, 11, 31);
  const daysLeft = Math.ceil((endOfYear - currentDate) / (1000 * 60 * 60 * 24));
  const totalDaysInYear = (currentYear % 4 === 0 && currentYear % 100 !== 0) || currentYear % 400 === 0 ? 366 : 365;
  const daysPassed = totalDaysInYear - daysLeft;
  const percentageLeft = Math.round((daysLeft / totalDaysInYear) * 100);

  // --- STYLES FOR HIGH RES (1220x2712) ---
  const styles = {
    // The invisible container that sets the image size
    captureContainer: {
      width: '1220px',
      height: '2712px',
      backgroundColor: '#161616', // Dark background
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center', // Vertically center the layout
      fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
      boxSizing: 'border-box',
      padding: '60px', 
    },
    wrapper: {
      width: '100%',
      maxWidth: '1000px', // Restricts grid width inside the huge canvas
    },
    grid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(3, 1fr)', // 3 Columns
      columnGap: '60px',
      rowGap: '70px',
    },
    monthBox: {
      display: 'flex',
      flexDirection: 'column',
      gap: '20px',
    },
    monthTitle: {
      color: '#888',
      fontSize: '32px', // Big font for mobile
      fontWeight: '500',
      margin: 0,
    },
    daysGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(7, 1fr)',
      gap: '14px', // Space between dots
    },
    dot: {
      width: '20px',
      height: '20px',
      borderRadius: '50%',
    },
    dotFuture: { backgroundColor: '#333' },
    dotPast: { backgroundColor: '#e0e0e0' }, // White/Gray for past
    dotCurrent: { backgroundColor: '#ff5722', boxShadow: '0 0 15px #ff5722' },
    
    footer: {
      marginTop: '150px',
      textAlign: 'center',
      fontSize: '48px', // Very large footer text
      color: '#666',
      fontWeight: '500',
    }
  };

  return (
    <div style={{ backgroundColor: '#222', minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      
      {/* This div is the source layout. 
        It is hidden from view but used by html-to-image.
      */}
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

      {/* FINAL OUTPUT: The Generated Image */}
      {imgUrl ? (
        <div style={{textAlign: 'center'}}>
          <p style={{color: '#aaa', marginBottom: '10px'}}>Right Click &gt; Save Image As... (1220 x 2712)</p>
          <img 
            src={imgUrl} 
            alt="Wallpaper" 
            style={{ 
              height: '80vh', // Scaled down for preview only
              border: '2px solid #555',
              boxShadow: '0 0 30px rgba(0,0,0,0.5)'
            }} 
          />
        </div>
      ) : (
        <h1 style={{color: 'white'}}>Generating High-Res Image...</h1>
      )}
    </div>
  );
};

export default App;