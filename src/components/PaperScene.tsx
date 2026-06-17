import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Outlines, ContactShadows, AdaptiveDpr, PerformanceMonitor, Float } from '@react-three/drei'
import { useRef, useMemo, useState, useCallback, useEffect } from 'react'
import * as THREE from 'three'
import { easing } from 'maath'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

/* ────────────────────────────────────────────────────────────────
   Gradient map for cel-shaded paper look
   ──────────────────────────────────────────────────────────────── */
function useGradientMap() {
  return useMemo(() => {
    const canvas = document.createElement('canvas')
    canvas.width = 4
    canvas.height = 1
    const ctx = canvas.getContext('2d')!
    // 4-band grayscale → material color tints it
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, 1, 1)
    ctx.fillStyle = '#cccccc'
    ctx.fillRect(1, 0, 1, 1)
    ctx.fillStyle = '#888888'
    ctx.fillRect(2, 0, 1, 1)
    ctx.fillStyle = '#444444'
    ctx.fillRect(3, 0, 1, 1)
    const texture = new THREE.CanvasTexture(canvas)
    texture.magFilter = THREE.NearestFilter
    texture.minFilter = THREE.NearestFilter
    return texture
  }, [])
}

/* ────────────────────────────────────────────────────────────────
   Procedural paper noise texture
   ──────────────────────────────────────────────────────────────── */
function usePaperTexture() {
  return useMemo(() => {
    const size = 256
    const canvas = document.createElement('canvas')
    canvas.width = size
    canvas.height = size
    const ctx = canvas.getContext('2d')!

    // Fill with white base
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, size, size)

    // Add paper grain noise
    const imageData = ctx.getImageData(0, 0, size, size)
    const data = imageData.data
    for (let i = 0; i < data.length; i += 4) {
      const noise = (Math.random() - 0.5) * 30 // subtle grain
      data[i] += noise     // R
      data[i + 1] += noise // G
      data[i + 2] += noise // B
    }
    ctx.putImageData(imageData, 0, 0)

    // Add fiber lines
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.03)'
    ctx.lineWidth = 0.5
    for (let i = 0; i < 40; i++) {
      ctx.beginPath()
      const x = Math.random() * size
      const y = Math.random() * size
      ctx.moveTo(x, y)
      ctx.lineTo(x + (Math.random() - 0.5) * 60, y + (Math.random() - 0.5) * 4)
      ctx.stroke()
    }

    const texture = new THREE.CanvasTexture(canvas)
    texture.wrapS = THREE.RepeatWrapping
    texture.wrapT = THREE.RepeatWrapping
    texture.repeat.set(2, 2)
    return texture
  }, [])
}

/* ────────────────────────────────────────────────────────────────
   Paper cutout helpers
   ──────────────────────────────────────────────────────────────── */
const OUTLINE_COLOR = '#2a1a3a'
const OUTLINE_THICKNESS = 0.04

interface PaperCutoutProps {
  shape: THREE.Shape
  color: string
  gradientMap: THREE.CanvasTexture
  map?: THREE.Texture
  position?: [number, number, number]
  rotation?: [number, number, number]
  scale?: number
  outlineThickness?: number
}

function PaperCutout({
  shape,
  color,
  gradientMap,
  map,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  scale = 1,
  outlineThickness = OUTLINE_THICKNESS,
}: PaperCutoutProps) {
  const geometry = useMemo(() => new THREE.ShapeGeometry(shape), [shape])
  return (
    <group position={position} rotation={rotation} scale={scale}>
      <mesh geometry={geometry}>
        <meshToonMaterial color={color} gradientMap={gradientMap} map={map} side={THREE.DoubleSide} />
        <Outlines thickness={outlineThickness} color={OUTLINE_COLOR} />
      </mesh>
    </group>
  )
}

/* ────────────────────────────────────────────────────────────────
   Hoverable wrapper for interactive paper elements
   ──────────────────────────────────────────────────────────────── */
function Hoverable({ children }: { children: React.ReactNode }) {
  const [hovered, setHovered] = useState(false)
  const ref = useRef<THREE.Group>(null!)

  useFrame((_, delta) => {
    if (!ref.current) return
    const targetScale = hovered ? 1.08 : 1
    easing.damp3(ref.current.scale, [targetScale, targetScale, targetScale], 0.3, delta)
  })

  return (
    <group
      ref={ref}
      onPointerEnter={() => {
        setHovered(true)
        document.body.style.cursor = 'pointer'
      }}
      onPointerLeave={() => {
        setHovered(false)
        document.body.style.cursor = 'auto'
      }}
    >
      {children}
    </group>
  )
}

function HoverablePaperCutout(props: PaperCutoutProps) {
  const [hovered, setHovered] = useState(false)
  const ref = useRef<THREE.Group>(null!)

  useFrame((_, delta) => {
    if (!ref.current) return
    const targetScale = hovered ? 1.08 : 1
    easing.damp3(ref.current.scale, [targetScale, targetScale, targetScale], 0.3, delta)
  })

  return (
    <group
      ref={ref}
      onPointerEnter={() => {
        setHovered(true)
        document.body.style.cursor = 'pointer'
      }}
      onPointerLeave={() => {
        setHovered(false)
        document.body.style.cursor = 'auto'
      }}
    >
      <PaperCutout {...props} />
    </group>
  )
}

/* ────────────────────────────────────────────────────────────────
   Camera rig for scroll-driven dolly
   ──────────────────────────────────────────────────────────────── */
function CameraRig() {
  const { camera } = useThree()
  const posRef = useRef({ z: 5 })

  useEffect(() => {
    const trigger = ScrollTrigger.create({
      trigger: '#hero',
      start: 'top top',
      end: 'bottom top',
      scrub: 1,
      onUpdate: (self) => {
        posRef.current.z = 5 - self.progress * 1.5
      },
    })
    return () => trigger.kill()
  }, [])

  useFrame((_, delta) => {
    easing.damp3(camera.position, [camera.position.x, camera.position.y, posRef.current.z], 0.5, delta)
  })

  return null
}

/* ────────────────────────────────────────────────────────────────
   Shape factories
   ──────────────────────────────────────────────────────────────── */
function createHillShape(width: number, height: number, asymmetry = 0): THREE.Shape {
  const shape = new THREE.Shape()
  const w = width / 2
  shape.moveTo(-w, 0)
  shape.bezierCurveTo(-w * 0.3, height + asymmetry, w * 0.3, height - asymmetry, w, 0)
  shape.lineTo(w, -2)
  shape.lineTo(-w, -2)
  shape.closePath()
  return shape
}

function createPineTreeShape(): THREE.Shape {
  // A wider, more detailed pine tree silhouette with overlapping triangle layers
  const shape = new THREE.Shape()
  shape.moveTo(0, 1.3)
  shape.lineTo(-0.35, 0.6)
  shape.lineTo(-0.15, 0.65)
  shape.lineTo(-0.4, 0.1)
  shape.lineTo(-0.12, 0.15)
  shape.lineTo(-0.3, -0.3)
  shape.lineTo(0.3, -0.3)
  shape.lineTo(0.12, 0.15)
  shape.lineTo(0.4, 0.1)
  shape.lineTo(0.15, 0.65)
  shape.lineTo(0.35, 0.6)
  shape.closePath()
  return shape
}

function createRoundBushShape(): THREE.Shape {
  // A round bush/shrub shape
  const shape = new THREE.Shape()
  shape.absarc(0, 0.15, 0.25, 0, Math.PI * 2, false)
  return shape
}

function createTrunkShape(): THREE.Shape {
  const shape = new THREE.Shape()
  shape.moveTo(-0.06, 0)
  shape.lineTo(-0.06, 0.25)
  shape.lineTo(0.06, 0.25)
  shape.lineTo(0.06, 0)
  shape.closePath()
  return shape
}

function createCloudShape(): THREE.Shape {
  // Puffy multi-circle cloud
  const shape = new THREE.Shape()
  // Main body
  shape.absarc(0, 0.15, 0.35, 0, Math.PI * 2, false)
  // Left bump
  shape.absarc(-0.4, 0.05, 0.25, 0, Math.PI * 2, false)
  // Right bump
  shape.absarc(0.5, 0.1, 0.28, 0, Math.PI * 2, false)
  // Top bump
  shape.absarc(0.15, 0.4, 0.22, 0, Math.PI * 2, false)
  return shape
}

function createSmallCloudShape(): THREE.Shape {
  // Smaller puffy cloud
  const shape = new THREE.Shape()
  shape.absarc(0, 0.1, 0.2, 0, Math.PI * 2, false)
  shape.absarc(-0.25, 0, 0.15, 0, Math.PI * 2, false)
  shape.absarc(0.25, 0.05, 0.18, 0, Math.PI * 2, false)
  return shape
}

/* ────────────────────────────────────────────────────────────────
   Layered parallax group
   ──────────────────────────────────────────────────────────────── */
interface ParallaxLayerProps {
  depth: number
  speed: number
  children: React.ReactNode
}

function ParallaxLayer({ depth, speed, children }: ParallaxLayerProps) {
  const groupRef = useRef<THREE.Group>(null!)
  const { pointer } = useThree()
  const target = useMemo(() => new THREE.Vector3(), [])

  useFrame((state, delta) => {
    if (!groupRef.current) return
    const mx = pointer.x * 0.8 * speed
    const my = pointer.y * 0.45 * speed
    const idleX = Math.sin(state.clock.elapsedTime * 0.35) * 0.025 * speed
    const idleY = Math.cos(state.clock.elapsedTime * 0.25) * 0.018 * speed

    target.set(mx + idleX, my + idleY, depth)
    easing.damp3(groupRef.current.position, target, 0.5, delta)
  })

  return <group ref={groupRef}>{children}</group>
}

/* ────────────────────────────────────────────────────────────────
   Stars component
   ──────────────────────────────────────────────────────────────── */
function Stars() {
  const stars = useMemo(() => {
    const result: { pos: [number, number, number]; size: number }[] = []
    for (let i = 0; i < 40; i++) {
      const x = (Math.random() - 0.5) * 20
      const y = Math.random() * 4 + 0.5
      const z = Math.random() * 0.3
      const size = 0.015 + Math.random() * 0.015
      result.push({ pos: [x, y, z], size })
    }
    return result
  }, [])

  return (
    <>
      {stars.map((s, i) => (
        <mesh key={`star-${i}`} position={s.pos}>
          <circleGeometry args={[s.size, 4]} />
          <meshBasicMaterial color="#ffffff" side={THREE.DoubleSide} />
        </mesh>
      ))}
    </>
  )
}

/* ────────────────────────────────────────────────────────────────
   Scene composition
   ──────────────────────────────────────────────────────────────── */
function Scene() {
  const gradientMap = useGradientMap()
  const paperTexture = usePaperTexture()

  const hill1 = useMemo(() => createHillShape(9, 1.4, 0.2), [])
  const hill2 = useMemo(() => createHillShape(7, 1.0, -0.15), [])
  const hill3 = useMemo(() => createHillShape(8, 1.2, 0.1), [])
  const hill4 = useMemo(() => createHillShape(6, 0.8, -0.1), [])
  const hill5 = useMemo(() => createHillShape(7, 1.0, 0.05), [])
  const treeShape = useMemo(() => createPineTreeShape(), [])
  const trunkShape = useMemo(() => createTrunkShape(), [])
  const cloudShape = useMemo(() => createCloudShape(), [])
  const smallCloudShape = useMemo(() => createSmallCloudShape(), [])
  const bushShape = useMemo(() => createRoundBushShape(), [])

  return (
    <>
      {/* Fog for depth */}
      <fog attach="fog" args={['#141520', 8, 25]} />

      {/* Lighting */}
      <ambientLight intensity={0.3} color="#1a1a2e" />
      <directionalLight
        position={[4, 6, 3]}
        intensity={1.4}
        color="#ffeedd"
        castShadow
      />
      <directionalLight position={[-2, 3, 1]} intensity={0.25} color="#2a2a4a" />

      {/* ── Layer 1: Sky, moon, stars & clouds ── */}
      <ParallaxLayer depth={-4.5} speed={0.15}>
        <mesh position={[0, 0, 0]}>
          <planeGeometry args={[24, 14]} />
          <meshBasicMaterial color="#0f1628" side={THREE.DoubleSide} />
        </mesh>

        {/* Stars */}
        <Stars />

        {/* Moon glow */}
        <mesh position={[3.5, 2.5, 0.05]}>
          <circleGeometry args={[1.5, 32]} />
          <meshBasicMaterial color="#ffd699" transparent opacity={0.08} side={THREE.DoubleSide} />
        </mesh>
        <mesh position={[3.5, 2.5, 0.1]}>
          <circleGeometry args={[0.8, 32]} />
          <meshBasicMaterial color="#ffd699" transparent opacity={0.15} side={THREE.DoubleSide} />
        </mesh>
        {/* Moon */}
        <mesh position={[3.5, 2.5, 0.15]}>
          <circleGeometry args={[0.5, 32]} />
          <meshBasicMaterial color="#ffeebb" side={THREE.DoubleSide} />
        </mesh>

        {/* Clouds */}
        <Float speed={0.5} rotationIntensity={0} floatIntensity={0.3}>
          <PaperCutout
            shape={cloudShape}
            color="#ffffff"
            gradientMap={gradientMap}
            map={paperTexture}
            position={[-2.5, 1.8, 0.2]}
            scale={1.2}
            outlineThickness={0.02}
          />
        </Float>
        <Float speed={0.4} rotationIntensity={0} floatIntensity={0.2}>
          <PaperCutout
            shape={cloudShape}
            color="#f5f8fc"
            gradientMap={gradientMap}
            map={paperTexture}
            position={[2, 2.2, 0.15]}
            scale={0.9}
            outlineThickness={0.02}
          />
        </Float>
        {/* Small cloud near top-left */}
        <Float speed={0.45} rotationIntensity={0} floatIntensity={0.25}>
          <PaperCutout
            shape={smallCloudShape}
            color="#eef4ff"
            gradientMap={gradientMap}
            map={paperTexture}
            position={[-4, 3.0, 0.1]}
            scale={0.8}
            outlineThickness={0.02}
          />
        </Float>
        {/* Small cloud near center-right */}
        <Float speed={0.35} rotationIntensity={0} floatIntensity={0.2}>
          <PaperCutout
            shape={smallCloudShape}
            color="#eef4ff"
            gradientMap={gradientMap}
            map={paperTexture}
            position={[4.5, 2.0, 0.1]}
            scale={0.7}
            outlineThickness={0.02}
          />
        </Float>
      </ParallaxLayer>

      {/* ── Layer 2: Far hills (warm tan) ── */}
      <ParallaxLayer depth={-3.2} speed={0.35}>
        <PaperCutout
          shape={hill1}
          color="oklch(0.78 0.08 75)"
          gradientMap={gradientMap}
          map={paperTexture}
          position={[0, -0.6, 0]}
        />
        <PaperCutout
          shape={hill2}
          color="oklch(0.72 0.07 70)"
          gradientMap={gradientMap}
          map={paperTexture}
          position={[2.5, -0.9, 0.1]}
        />
      </ParallaxLayer>

      {/* ── Layer 3: Mid hills, trees & bushes (green) ── */}
      <ParallaxLayer depth={-2.2} speed={0.55}>
        <PaperCutout
          shape={hill3}
          color="oklch(0.58 0.09 150)"
          gradientMap={gradientMap}
          map={paperTexture}
          position={[0, -0.8, 0]}
        />
        {/* Trees with multi-layered pine shape */}
        <Hoverable>
          <group position={[-2.2, -0.3, 0.1]}>
            <PaperCutout shape={trunkShape} color="oklch(0.55 0.08 70)" gradientMap={gradientMap} map={paperTexture} />
            <PaperCutout shape={treeShape} color="oklch(0.48 0.11 150)" gradientMap={gradientMap} map={paperTexture} position={[0, 0.25, 0]} />
          </group>
        </Hoverable>
        <Hoverable>
          <group position={[1.8, -0.5, 0.05]}>
            <PaperCutout shape={trunkShape} color="oklch(0.55 0.08 70)" gradientMap={gradientMap} map={paperTexture} />
            <PaperCutout shape={treeShape} color="oklch(0.50 0.10 150)" gradientMap={gradientMap} map={paperTexture} position={[0, 0.25, 0]} scale={0.85} />
          </group>
        </Hoverable>
        <Hoverable>
          <group position={[0.3, -0.4, 0.15]}>
            <PaperCutout shape={trunkShape} color="oklch(0.55 0.08 70)" gradientMap={gradientMap} map={paperTexture} />
            <PaperCutout shape={treeShape} color="oklch(0.52 0.10 150)" gradientMap={gradientMap} map={paperTexture} position={[0, 0.25, 0]} scale={0.75} />
          </group>
        </Hoverable>
        {/* Round bushes near buildings */}
        <Hoverable>
          <PaperCutout shape={bushShape} color="oklch(0.55 0.09 150)" gradientMap={gradientMap} map={paperTexture} position={[-0.5, -0.75, 0.2]} scale={0.8} outlineThickness={0.02} />
        </Hoverable>
        <Hoverable>
          <PaperCutout shape={bushShape} color="oklch(0.50 0.08 145)" gradientMap={gradientMap} map={paperTexture} position={[0.8, -0.65, 0.25]} scale={0.6} outlineThickness={0.02} />
        </Hoverable>
      </ParallaxLayer>

      {/* ── Layer 4: Buildings ── */}
      <ParallaxLayer depth={-1.6} speed={0.75}>
        {/* House 1 */}
        <Hoverable>
          <group position={[-1.2, -0.9, 0]}>
            <mesh>
              <boxGeometry args={[0.7, 0.7, 0.12]} />
              <meshToonMaterial color="oklch(0.92 0.015 80)" gradientMap={gradientMap} map={paperTexture} />
              <Outlines thickness={0.03} color={OUTLINE_COLOR} />
            </mesh>
            <mesh position={[0, 0.55, 0]}>
              <coneGeometry args={[0.5, 0.4, 4]} />
              <meshToonMaterial color="oklch(0.68 0.09 235)" gradientMap={gradientMap} map={paperTexture} />
              <Outlines thickness={0.03} color={OUTLINE_COLOR} />
            </mesh>
            {/* Door */}
            <mesh position={[0, -0.2, 0.07]}>
              <planeGeometry args={[0.15, 0.3]} />
              <meshToonMaterial color="oklch(0.55 0.06 70)" gradientMap={gradientMap} map={paperTexture} />
              <Outlines thickness={0.02} color={OUTLINE_COLOR} />
            </mesh>
          </group>
        </Hoverable>

        {/* House 2 */}
        <Hoverable>
          <group position={[1.0, -1.0, 0.1]}>
            <mesh>
              <boxGeometry args={[0.6, 0.6, 0.12]} />
              <meshToonMaterial color="oklch(0.95 0.012 80)" gradientMap={gradientMap} map={paperTexture} />
              <Outlines thickness={0.03} color={OUTLINE_COLOR} />
            </mesh>
            <mesh position={[0, 0.48, 0]}>
              <coneGeometry args={[0.42, 0.35, 4]} />
              <meshToonMaterial color="oklch(0.75 0.11 55)" gradientMap={gradientMap} map={paperTexture} />
              <Outlines thickness={0.03} color={OUTLINE_COLOR} />
            </mesh>
            {/* Window */}
            <mesh position={[0, 0.05, 0.07]}>
              <planeGeometry args={[0.18, 0.18]} />
              <meshToonMaterial color="oklch(0.85 0.05 230)" gradientMap={gradientMap} map={paperTexture} />
              <Outlines thickness={0.02} color={OUTLINE_COLOR} />
            </mesh>
          </group>
        </Hoverable>

        {/* Small tower */}
        <Hoverable>
          <group position={[2.2, -0.85, 0.05]}>
            <mesh>
              <boxGeometry args={[0.35, 0.9, 0.12]} />
              <meshToonMaterial color="oklch(0.90 0.02 75)" gradientMap={gradientMap} map={paperTexture} />
              <Outlines thickness={0.03} color={OUTLINE_COLOR} />
            </mesh>
            <mesh position={[0, 0.6, 0]}>
              <coneGeometry args={[0.28, 0.3, 4]} />
              <meshToonMaterial color="oklch(0.65 0.08 235)" gradientMap={gradientMap} map={paperTexture} />
              <Outlines thickness={0.03} color={OUTLINE_COLOR} />
            </mesh>
          </group>
        </Hoverable>

        {/* Paper fence near buildings */}
        <group position={[-0.5, -1.15, 0.15]}>
          {/* Horizontal bar */}
          <mesh position={[0, 0.12, 0]}>
            <planeGeometry args={[0.7, 0.04]} />
            <meshToonMaterial color="oklch(0.65 0.05 75)" gradientMap={gradientMap} map={paperTexture} side={THREE.DoubleSide} />
            <Outlines thickness={0.015} color={OUTLINE_COLOR} />
          </mesh>
          {/* Vertical posts */}
          {[-0.25, 0, 0.25].map((x, i) => (
            <mesh key={`fence-${i}`} position={[x, 0.06, 0.01]}>
              <planeGeometry args={[0.04, 0.22]} />
              <meshToonMaterial color="oklch(0.60 0.05 70)" gradientMap={gradientMap} map={paperTexture} side={THREE.DoubleSide} />
              <Outlines thickness={0.015} color={OUTLINE_COLOR} />
            </mesh>
          ))}
        </group>
      </ParallaxLayer>

      {/* ── Layer 5: Near hills (darker green) ── */}
      <ParallaxLayer depth={-1.0} speed={0.95}>
        <PaperCutout
          shape={hill4}
          color="oklch(0.52 0.08 150)"
          gradientMap={gradientMap}
          map={paperTexture}
          position={[0, -1.1, 0]}
        />
        <PaperCutout
          shape={hill5}
          color="oklch(0.48 0.07 145)"
          gradientMap={gradientMap}
          map={paperTexture}
          position={[-1.5, -1.2, 0.1]}
        />
        {/* Near trees */}
        <Hoverable>
          <group position={[-0.8, -0.7, 0.15]}>
            <PaperCutout shape={trunkShape} color="oklch(0.50 0.07 70)" gradientMap={gradientMap} map={paperTexture} />
            <PaperCutout shape={treeShape} color="oklch(0.42 0.10 150)" gradientMap={gradientMap} map={paperTexture} position={[0, 0.25, 0]} scale={1.1} />
          </group>
        </Hoverable>
        <Hoverable>
          <group position={[2.0, -0.8, 0.1]}>
            <PaperCutout shape={trunkShape} color="oklch(0.50 0.07 70)" gradientMap={gradientMap} map={paperTexture} />
            <PaperCutout shape={treeShape} color="oklch(0.45 0.09 150)" gradientMap={gradientMap} map={paperTexture} position={[0, 0.25, 0]} scale={0.95} />
          </group>
        </Hoverable>
      </ParallaxLayer>

      {/* ── Layer 6: Foreground grass & details ── */}
      <ParallaxLayer depth={-0.4} speed={1.15}>
        {/* Grass base */}
        <mesh position={[0, -1.8, 0]}>
          <planeGeometry args={[14, 1.2]} />
          <meshToonMaterial color="oklch(0.55 0.09 150)" gradientMap={gradientMap} map={paperTexture} side={THREE.DoubleSide} />
          <Outlines thickness={0.04} color={OUTLINE_COLOR} />
        </mesh>

        {/* Grass blades (original 6 + 3 more scattered) */}
        {[-3, -2.2, -1.5, 3.2, 4.0, 4.8, -4.2, 5.5, -0.5].map((x, i) => (
          <mesh key={`grass-${i}`} position={[x, -1.6 + (i % 2) * 0.08, 0.05]}>
            <planeGeometry args={[0.06, 0.25]} />
            <meshToonMaterial color="oklch(0.50 0.08 150)" gradientMap={gradientMap} side={THREE.DoubleSide} />
            <Outlines thickness={0.015} color={OUTLINE_COLOR} />
          </mesh>
        ))}

        {/* Flowers */}
        {[
          { x: -2.8, y: -1.55, color: 'oklch(0.75 0.12 55)' },
          { x: -1.8, y: -1.5, color: 'oklch(0.70 0.10 330)' },
          { x: 3.0, y: -1.52, color: 'oklch(0.78 0.11 55)' },
          { x: 4.2, y: -1.58, color: 'oklch(0.72 0.09 300)' },
        ].map((f, i) => (
          <Hoverable key={`flower-${i}`}>
            <group position={[f.x, f.y, 0.08]}>
              {/* Stem */}
              <mesh>
                <planeGeometry args={[0.02, 0.15]} />
                <meshToonMaterial color="oklch(0.52 0.08 150)" gradientMap={gradientMap} side={THREE.DoubleSide} />
                <Outlines thickness={0.01} color={OUTLINE_COLOR} />
              </mesh>
              {/* Petals */}
              <mesh position={[0, 0.1, 0]}>
                <circleGeometry args={[0.06, 5]} />
                <meshToonMaterial color={f.color} gradientMap={gradientMap} side={THREE.DoubleSide} />
                <Outlines thickness={0.015} color={OUTLINE_COLOR} />
              </mesh>
              {/* Center */}
              <mesh position={[0, 0.1, 0.01]}>
                <circleGeometry args={[0.025, 8]} />
                <meshToonMaterial color="oklch(0.85 0.10 80)" gradientMap={gradientMap} side={THREE.DoubleSide} />
              </mesh>
            </group>
          </Hoverable>
        ))}

        {/* Small paper boat on the grass */}
        <group position={[0.7, -1.45, 0.1]}>
          <mesh>
            <shapeGeometry
              args={[
                new THREE.Shape([
                  new THREE.Vector2(-0.1, 0),
                  new THREE.Vector2(0, 0.08),
                  new THREE.Vector2(0.1, 0),
                ]),
              ]}
            />
            <meshToonMaterial color="oklch(0.70 0.10 45)" gradientMap={gradientMap} side={THREE.DoubleSide} />
            <Outlines thickness={0.015} color={OUTLINE_COLOR} />
          </mesh>
        </group>

        {/* Butterfly 1 (original — orange) */}
        <Float speed={1.2} rotationIntensity={0.4} floatIntensity={0.5}>
          <group position={[1.5, -1.3, 0.2]}>
            <mesh rotation={[0, 0, 0.3]}>
              <planeGeometry args={[0.12, 0.08]} />
              <meshToonMaterial color="oklch(0.75 0.11 55)" gradientMap={gradientMap} side={THREE.DoubleSide} />
              <Outlines thickness={0.01} color={OUTLINE_COLOR} />
            </mesh>
            <mesh rotation={[0, 0, -0.3]} position={[0.08, 0, 0]}>
              <planeGeometry args={[0.12, 0.08]} />
              <meshToonMaterial color="oklch(0.75 0.11 55)" gradientMap={gradientMap} side={THREE.DoubleSide} />
              <Outlines thickness={0.01} color={OUTLINE_COLOR} />
            </mesh>
          </group>
        </Float>

        {/* Butterfly 2 (different color — pink/purple, different position) */}
        <Float speed={1.0} rotationIntensity={0.3} floatIntensity={0.4}>
          <group position={[-2.0, -1.1, 0.25]}>
            <mesh rotation={[0, 0, 0.25]}>
              <planeGeometry args={[0.1, 0.06]} />
              <meshToonMaterial color="oklch(0.70 0.12 330)" gradientMap={gradientMap} side={THREE.DoubleSide} />
              <Outlines thickness={0.01} color={OUTLINE_COLOR} />
            </mesh>
            <mesh rotation={[0, 0, -0.25]} position={[0.06, 0, 0]}>
              <planeGeometry args={[0.1, 0.06]} />
              <meshToonMaterial color="oklch(0.70 0.12 330)" gradientMap={gradientMap} side={THREE.DoubleSide} />
              <Outlines thickness={0.01} color={OUTLINE_COLOR} />
            </mesh>
          </group>
        </Float>
      </ParallaxLayer>

      {/* Ground shadows */}
      <ContactShadows
        position={[0, -2.4, 0]}
        opacity={0.2}
        scale={12}
        blur={2.5}
        far={5}
        color="#000000"
      />
    </>
  )
}

/* ────────────────────────────────────────────────────────────────
   Exported canvas wrapper
   ──────────────────────────────────────────────────────────────── */
export default function PaperScene() {
  const [dpr, setDpr] = useState(1.5)

  const handleDecline = useCallback(() => {
    setDpr(1)
  }, [])

  return (
    <Canvas
      dpr={[1, dpr]}
      frameloop="always"
      camera={{ position: [0, 0.2, 5], fov: 45, near: 0.1, far: 50 }}
      gl={{ antialias: true, alpha: false }}
      style={{ background: '#141520', width: '100%', height: '100%' }}
    >
      <PerformanceMonitor onDecline={handleDecline} />
      <AdaptiveDpr />
      <CameraRig />
      <Scene />
    </Canvas>
  )
}
