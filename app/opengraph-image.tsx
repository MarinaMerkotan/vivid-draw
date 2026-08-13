import { ImageResponse } from 'next/og';

export const alt = 'Vividraw — Make something loud today';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

const swatches = ['#ff5f55', '#9c6bff', '#4ad7e6', '#c7f464'];

export default function OpenGraphImage() {
  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        position: 'relative',
        overflow: 'hidden',
        background: '#191821',
        color: '#faf9ff',
        fontFamily: 'Arial, sans-serif',
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          opacity: 0.2,
          backgroundImage:
            'radial-gradient(circle at 16% 10%, #ff5f55 0, transparent 30%), radial-gradient(circle at 75% 14%, #9c6bff 0, transparent 32%), radial-gradient(circle at 92% 82%, #4ad7e6 0, transparent 30%)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          inset: 30,
          display: 'flex',
          border: '1px solid rgba(255,255,255,0.12)',
          borderRadius: 30,
        }}
      />
      <div
        style={{
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '68px 76px 66px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
          <div
            style={{
              width: 58,
              height: 58,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 18,
              background: 'linear-gradient(135deg, #ff5f55, #9c6bff)',
              color: '#191821',
              fontSize: 31,
              fontWeight: 900,
            }}
          >
            V
          </div>
          <div style={{ display: 'flex', fontSize: 30, fontWeight: 800, letterSpacing: -1 }}>Vividraw</div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', fontSize: 82, fontWeight: 800, lineHeight: 0.98, letterSpacing: -4 }}>
            Make something
          </div>
          <div
            style={{
              display: 'flex',
              fontSize: 82,
              fontWeight: 800,
              lineHeight: 1.02,
              letterSpacing: -4,
              color: '#ff756c',
            }}
          >
            loud today.
          </div>
          <div style={{ display: 'flex', marginTop: 24, color: '#b9b5c6', fontSize: 25 }}>
            Expressive brushes · layers · palettes · animated replay
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', gap: 10 }}>
            {swatches.map((color) => (
              <div key={color} style={{ width: 42, height: 12, display: 'flex', borderRadius: 999, background: color }} />
            ))}
          </div>
          <div style={{ display: 'flex', color: '#777283', fontSize: 18, letterSpacing: 2, textTransform: 'uppercase' }}>
            Browser drawing studio
          </div>
        </div>
      </div>
    </div>,
    size,
  );
}
