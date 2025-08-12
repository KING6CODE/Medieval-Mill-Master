import '../styles/globals.css';
import Link from 'next/link';

export default function App({ Component, pageProps }) {
  return (
    <>
      <nav className="global-nav">
        <div className="nav-inner">
          <Link href="/"><a className="logo">🏰 <span>MillMaster</span></a></Link>
          <div className="nav-links">
            <Link href="/"><a>Jeu</a></Link>
            <Link href="/technologie"><a>Technologie</a></Link>
          </div>
        </div>
      </nav>
      <Component {...pageProps} />
      <style jsx>{`
        .global-nav { position:sticky; top:0; z-index:999; backdrop-filter: blur(6px); background:linear-gradient(180deg, rgba(6,10,24,0.6), rgba(6,10,24,0.45)); border-bottom:1px solid rgba(255,255,255,0.03); }
        .nav-inner { max-width:1200px; margin:0 auto; display:flex; align-items:center; justify-content:space-between; padding:12px 20px; color:#eef3ff; }
        .logo { font-weight:800; color:#fff; display:flex; gap:8px; align-items:center; text-decoration:none; }
        .nav-links a { margin-left:18px; color:rgba(255,255,255,0.85); text-decoration:none; font-weight:700; }
        .nav-links a:hover{ color:#cfe3ff; text-decoration:underline; }
      `}</style>
    </>
  );
}
