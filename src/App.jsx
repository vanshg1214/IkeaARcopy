import React, { Suspense, useMemo, useRef, useState, useEffect } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { 
  Environment, 
  ContactShadows, 
  useGLTF, 
  OrbitControls,
  Html,
  useProgress,
  Line
} from '@react-three/drei'
import * as THREE from 'three'

// --- 3D COMPONENTS ---

function Loader() {
  const { progress } = useProgress()
  return (
    <Html center>
      <div className="loader-container">
        <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem'}}>
          <div className="loader"></div>
          <div style={{color: '#1760a5', fontSize: '0.8rem', fontWeight: 600}}>
            {progress.toFixed(0)}%
          </div>
        </div>
      </div>
    </Html>
  )
}

function formatDim(value) {
    let cm = 0;
    if (value > 100) cm = value / 10;
    else if (value > 10) cm = value;
    else cm = value * 100;
    const inch = cm / 2.54;
    return `${cm.toFixed(1)} cm (${inch.toFixed(1)}")`;
}

function Dimension({ p1, p2, offset, text, maxSize }) {
  const v1 = new THREE.Vector3(...p1)
  const v2 = new THREE.Vector3(...p2)
  const dir = v2.clone().sub(v1).normalize()
  const mid = v1.clone().lerp(v2, 0.5)
  const off = new THREE.Vector3(...offset)
  const start = v1.clone().add(off)
  const end = v2.clone().add(off)
  const center = mid.clone().add(off)
  const quaternion = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir)
  const arrowRad = maxSize * 0.015;
  const arrowHeight = maxSize * 0.05;

  return (
    <group>
      <Line points={[start, end]} color="#1760a5" lineWidth={2} />
      <mesh position={start} quaternion={quaternion}>
        <group rotation={[Math.PI, 0, 0]}>
          <mesh position={[0, -arrowHeight / 2, 0]}>
            <coneGeometry args={[arrowRad, arrowHeight, 16]} />
            <meshBasicMaterial color="#1760a5" />
          </mesh>
        </group>
      </mesh>
      <mesh position={end} quaternion={quaternion}>
        <mesh position={[0, -arrowHeight / 2, 0]}>
          <coneGeometry args={[arrowRad, arrowHeight, 16]} />
          <meshBasicMaterial color="#1760a5" />
        </mesh>
      </mesh>
      <Html position={center} center zIndexRange={[100, 0]}>
        <div className="dimension-label">{text}</div>
      </Html>
    </group>
  )
}

function Dimensions({ box }) {
  const size = box.getSize(new THREE.Vector3())
  const min = box.min;
  const max = box.max;
  const maxSize = Math.max(size.x, size.y, size.z)
  const pad = maxSize * 0.08

  const pWidthStart = [min.x, max.y, max.z];
  const pWidthEnd = [max.x, max.y, max.z];
  const offWidth = [0, pad * 0.2, pad * 0.8];

  const pDepthStart = [max.x, max.y, min.z];
  const pDepthEnd = [max.x, max.y, max.z];
  const offDepth = [pad * 1.0, pad * 0.2, 0];

  return (
    <group>
      <Dimension p1={pWidthStart} p2={pWidthEnd} offset={offWidth} text={formatDim(size.x)} maxSize={maxSize} />
      <Dimension p1={pDepthStart} p2={pDepthEnd} offset={offDepth} text={formatDim(size.z)} maxSize={maxSize} />
    </group>
  )
}

function Model({ url, ...props }) {
  const { scene } = useGLTF(url)
  const groupRef = useRef()
  const { box, center } = useMemo(() => {
    const clonedScene = scene.clone()
    const box = new THREE.Box3().setFromObject(clonedScene)
    const center = box.getCenter(new THREE.Vector3())
    return { box, center }
  }, [scene])

  useFrame(() => {
    if (groupRef.current) {
      groupRef.current.scale.x = THREE.MathUtils.lerp(groupRef.current.scale.x, 1, 0.05)
      groupRef.current.scale.y = THREE.MathUtils.lerp(groupRef.current.scale.y, 1, 0.05)
      groupRef.current.scale.z = THREE.MathUtils.lerp(groupRef.current.scale.z, 1, 0.05)
    }
  })

  return (
    <group {...props}>
      <group ref={groupRef} scale={[0, 0, 0]}>
        <group position={[-center.x, -center.y, -center.z]}>
          <primitive object={scene} />
          <Dimensions box={box} />
        </group>
      </group>
    </group>
  )
}

// --- MAIN APP COMPONENT ---

export default function App() {
  const modelUrl = '/Cutting board.glb'
  const arViewerRef = useRef(null)
  const [showQR, setShowQR] = useState(false)
  const [currentUrl, setCurrentUrl] = useState('')

  useEffect(() => {
    setCurrentUrl(window.location.href)
  }, [])

  const handleARClick = () => {
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)
    if (!isMobile) {
      setShowQR(true)
      return
    }
    if (arViewerRef.current) arViewerRef.current.activateAR()
  }

  return (
    <div className="app-container">
      {/* IKEA-style Header */}
      <header className="header">
        <div className="ikea-logo">BOSCH</div>
        <div className="search-bar">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
          <span>What are you looking for?</span>
        </div>
        <div className="nav-icons">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
        </div>
      </header>

      {/* Breadcrumbs */}
      <nav className="breadcrumbs">
        <span>Products</span>
        <span>/</span>
        <span>Kitchen Accessories</span>
        <span>/</span>
        <span>Preparation Tools</span>
        <span>/</span>
        <span style={{fontWeight: 600}}>Solid Wood Cutting Board</span>
      </nav>

      <main className="product-layout">
        {/* Left Thumbnails */}
        <aside className="thumbnail-list">
          <div className="thumb-item active">
            <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#888"><rect x="2" y="2" width="20" height="20" rx="2"/><path d="M7 11c0-1.1.9-2 2-2h6a2 2 0 0 1 2 2v6H7v-6Z"/></svg>
          </div>
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="thumb-item">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ddd"><path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242"/></svg>
            </div>
          ))}
        </aside>

        {/* Central 3D Viewer */}
        <section className="viewer-container">
          <Canvas shadows camera={{ position: [3, 2, 3], fov: 35 }}>
            <color attach="background" args={['#f9f9f9']} />
            <ambientLight intensity={1.5} />
            <directionalLight position={[5, 10, 5]} intensity={1} castShadow />
            <Suspense fallback={<Loader />}>
              <Model url={modelUrl} scale={3.5} position={[0, -0.2, 0]} />
              <ContactShadows position={[0, -0.6, 0]} opacity={0.15} scale={10} blur={2.5} far={4} color="#000" />
              <Environment preset="studio" />
            </Suspense>
            <OrbitControls makeDefault enablePan={false} />
          </Canvas>

          <div className="viewer-actions">
            <button className="action-pill">
              <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M15 2a1 1 0 0 0-1-1H2a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V2zM0 2a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V2z"/><path d="M5 4.5a.5.5 0 0 1 .5-.5h5a.5.5 0 0 1 0 1h-5a.5.5 0 0 1-.5-.5zM5 7a.5.5 0 0 1 .5-.5h5a.5.5 0 0 1 0 1h-5A.5.5 0 0 1 5 7zm0 2.5a.5.5 0 0 1 .5-.5h5a.5.5 0 0 1 0 1h-5a.5.5 0 0 1-.5-.5z"/></svg>
              All media
            </button>
            <button className="action-pill" onClick={handleARClick}>
              <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M8 0a8 8 0 1 0 0 16A8 8 0 0 0 8 0zM4.5 7.5a.5.5 0 0 1 .5-.5h6a.5.5 0 0 1 0 1h-6a.5.5 0 0 1-.5-.5z"/></svg>
              View in AR
            </button>
          </div>
        </section>

        {/* Right Info Panel */}
        <section className="product-info-panel">
          <div className="brand-series">BOSCH WOODEN</div>
          <h1 style={{fontSize: '1.4rem', marginBottom: '8px'}}>Solid Oak Cutting Board, Natural</h1>
          <div className="product-desc">Round 30 cm (12")</div>
          
          <div className="price-container">
            <span style={{fontSize: '1rem', verticalAlign: 'top', marginRight: '4px'}}>Rs.</span>2,499
          </div>
          <div className="price-sub">Price incl. of all taxes</div>

          <div className="rating-row">
            <div style={{color: '#000'}}>★★★★★</div>
            <span style={{color: '#0058a3', textDecoration: 'underline'}}>(154 reviews)</span>
          </div>

          <div className="options-box">
             <div className="option-row">
                <span className="option-title">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                  Delivery
                </span>
                <span style={{fontSize: '0.8rem', color: '#666'}}>Check availability</span>
             </div>
             <hr style={{margin: '15px 0', border: 0, borderTop: '1px solid #eee'}} />
             <div className="option-row">
                <span className="option-title">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10V4a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v6h18ZM3 10v10a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V10M12 10v12"/></svg>
                  At store
                </span>
                <span style={{fontSize: '0.8rem', color: '#666'}}>Check nearest store</span>
             </div>
          </div>

          <button className="add-to-cart">Add to bag</button>
        </section>
      </main>

      <div className="footer-desc">
        <h3 style={{color: '#000', marginBottom: '15px'}}>Product details</h3>
        <p>
          A clean expression that fits right in, in the kitchen or wherever you place it. 
          Smooth-finish solid oak and crafted with a focus on durability. Ideal for chopping, 
          serving, and adding a touch of natural elegance to your culinary workspace.
        </p>
      </div>

      {/* AR QR Modal */}
      {showQR && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
          backgroundColor: 'rgba(255, 255, 255, 0.95)', backdropFilter: 'blur(10px)',
          zIndex: 5000, display: 'flex', justifyContent: 'center', alignItems: 'center'
        }}>
           <div style={{
              background: 'white', padding: '3rem', borderRadius: '32px', 
              boxShadow: '0 30px 60px rgba(0,0,0,0.12)', textAlign: 'center',
              border: '1px solid #1760a5', maxWidth: '400px'
           }}>
              <h2 style={{ color: '#0058a3', marginBottom: '1rem', fontWeight: 800 }}>Scan For AR</h2>
              <p style={{ color: '#555', marginBottom: '2rem', fontSize: '1rem' }}>
                Open your camera and scan the code to place this board on your kitchen counter!
              </p>
              <div style={{ background: '#f5f5f5', padding: '1.5rem', borderRadius: '24px' }}>
                <img 
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&margin=0&data=${encodeURIComponent(currentUrl)}`} 
                  alt="QR Code" 
                  style={{ width: '200px', height: '200px', borderRadius: '12px' }} 
                />
              </div>
              <button onClick={() => setShowQR(false)} className="add-to-cart" style={{marginTop: '2rem', padding: '15px'}}>Got it</button>
           </div>
        </div>
      )}

      {/* Hidden AR engine */}
      <model-viewer ref={arViewerRef} src={modelUrl} ar ar-scale="fixed" ar-modes="scene-viewer webxr quick-look" style={{display: 'none'}} />
    </div>
  )
}

useGLTF.preload('/Cutting board.glb')
