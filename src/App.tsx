import React from 'react';
import * as THREE from 'three';
import './App.css';
import styled from "styled-components";

const SCALE = 1;
const RATIO = 2.16454997239;
const TIME_SCALE = 0.5

const fragmentShader = `
  #include <common>

  uniform vec3 iResolution;
  uniform float iTime;
  uniform float iCull;

  // By iq: https://www.shadertoy.com/user/iq  
  // license: Creative Commons Attribution-NonCommercial-ShareAlike 3.0 Unported License.
  // Created by Andrew Wild - akohdr/2016
  // License Creative Commons Attribution-NonCommercial-ShareAlike 3.0 Unported License.

  #define R iResolution
  #define T (iTime/3.+5.)
  #define C iCull

  void mainImage( out vec4 k, vec2 p )
  {
    #define rot(p,a) vec2 sc=sin(vec2(a,a+1.6)); p*=mat2(sc.y,-sc.x,sc);

      #define A vec3(0,1,157)
      #define B {vec2 m=fract(p),l=dot(p-m,A.yz)+A.xz,r=mix(fract(57.*sin(l++)),fract(57.*sin(l)),(m*=m*(3.-m-m)).x);k+=mix(r.x,r.y,m.y)/(s+=s);p*=mat2(1,1,1,-1);}

      float amplitude = 1.;
      float frequency = .001;
      float y = sin(T * frequency);
      float t = 0.01*(T*130.0);
      y += sin(T*frequency*2.1 + t)*4.5;
      y += sin(T*frequency*1.72 + t*1.121)*4.0;
      y += sin(T*frequency*2.221 + t*0.437)*5.0;
      y += sin(T*frequency*3.1122+ t*4.269)*2.5;
      y *= amplitude*0.06;


      p *= log(0.1)/R.y;        // scaling (slow zoom out)
      p.x += y * .05;           // translation
      p.y += sin(T*.05);
      rot(p,T/22.);         // slow field rotation

      float s = 1.; k = vec4(0);    // init
      B B B B B // unrolled perlin noise see https://www.shadertoy.com/view/lt3GWn

      vec4 ex = sin(2.*sin(k*22.+T*2.)+p.yxyy-p.yyxy*.5)/6.;
      k += ex + C;    // colour transform
      k += vec4(0,0,0,0.1);
      k.w = 1.;
  }

  void main() {
    mainImage(gl_FragColor, gl_FragCoord.xy);
  }
`;

const Bars = styled.div`
  display: flex;
  height: 50vh;
  width: 100vw;
`

const Bar = styled.div`
  background-color: ${(props) => props.color};
  height: 100%;
  flex-grow: 1;
`

const HiddenIMG = styled.img`
  display: none;
`

const HiddenCanvas = styled.canvas`
  display: none;
`

const Canvas = styled.canvas`
  position: absolute;
  top:0;
  left:0;
`

const Wrapper = styled.div`
  position: relative;
  height: 100vh;
  width: 100vw;
`

const OilCanvas = styled.canvas`
  position:absolute;
  top:0;
  left:0;
  mix-blend-mode: color-burn;
`
const BG = styled.div`
  width:  ${SCALE * 100}vw;
  height: calc(${SCALE * 100}vw / ${RATIO});
  background-image: url('${(props: BGProps) => props.image}');
  background-size: cover;
  position: absolute;
  top:0;
  left:0;
  display: ${(props: BGProps) => props.show ? "block" : "none"};
`

const audioCtx = new AudioContext();
const analyserSand = audioCtx.createAnalyser();
analyserSand.fftSize = 32
const analyserWater = audioCtx.createAnalyser();
analyserWater.fftSize = 32
const bufferLength = analyserSand.frequencyBinCount;;
const dataArraySand = new Uint8Array(bufferLength);
const dataArrayWater = new Uint8Array(bufferLength);
// const draw = () => {
//   requestAnimationFrame(draw);
//   analyserSand.getByteFrequencyData(dataArraySand);

//   console.log(1)

//   for (let i = 0; i < bufferLength; i++) {
//     const height = dataArraySand[i] / 255 * 100;
//     const bar = document.getElementById(`barSand-${i}`)
//     if (bar) {
//       bar.style.height = height + "%"
//     }
//   }

//   analyserWater.getByteFrequencyData(dataArrayWater);

//   for (let i = 0; i < bufferLength; i++) {
//     const height = dataArrayWater[i] / 255 * 100;
//     const bar = document.getElementById(`barWater-${i}`)
//     if (bar) {
//       bar.style.height = height + "%"
//     }
//   }
// }


let POS = 0
let WAIT: string | null = null
let currentOldBlocks: number[], currentBlocks: number[], currentDimensions: Dimensions, ctx: CanvasRenderingContext2D, play: React.MutableRefObject<boolean>;


type BGProps = {
  image: string
  show: boolean
}

type Dimensions = {
  width: number,
  height: number,
  image: HTMLCanvasElement,
  imageRatio: number,
  imageBlockFactor: number,
  blocksPerFrame: number,
  totalBlocks: number,
  frame: Frame,
  blockSize: number,
}

type Step = {
  src: string,
  cx: number,
  cy: number
  type: "appear" | "fade",
  seconds: number,
  hold: number,
}

const SCRIPT_RAW: Array<Step> = [
  {
    src: "title.png",
    cx: 0.5,
    cy: 0.2,
    type: "fade",
    seconds: 8,
    hold: 0,
  },
  {
    src: "frame-1.jpg",
    cx: 0.8,
    cy: 0.5,
    type: "fade",
    seconds: 8,
    hold: 3,
  },
  {
    src: "title-1.jpg",
    cx: 0,
    cy: 0,
    type: "fade",
    seconds: 1,
    hold: 3,
  },
  {
    src: "frame-2.jpg",
    cx: 0.5,
    cy: 0.2,
    type: "fade",
    seconds: 8,
    hold: 0,
  },
  {
    src: "title-2.jpg",
    cx: 0.5,
    cy: 0.2,
    type: "fade",
    seconds: 3,
    hold: 3,
  },
  {
    src: "frame-3.jpg",
    cx: 0.5,
    cy: 0.5,
    type: "fade",
    seconds: 8,
    hold: 0,
  },
  {
    src: "title-3.jpg",
    cx: 0.5,
    cy: 0.5,
    type: "fade",
    seconds: 3,
    hold: 0,
  },
  {
    src: "frame-4.png",
    cx: 0.7,
    cy: 0.5,
    type: "fade",
    seconds: 3,
    hold: 3,
  },
  {
    src: "frame-5.jpg",
    cx: 0,
    cy: 0.5,
    type: "fade",
    seconds: 3,
    hold: 0,
  },
  {
    src: "frame-6.jpg",
    cx: 0,
    cy: 0.5,
    type: "fade",
    seconds: 8,
    hold: 5,
  },
  {
    src: "frame-7.jpg",
    cx: 0.5,
    cy: 0.4,
    type: "fade",
    seconds: 8,
    hold: 0,
  },
  {
    src: "frame-8.png",
    cx: 0.5,
    cy: 0.4,
    type: "fade",
    seconds: 5,
    hold: 3,
  },
  {
    src: "frame-8-a.png",
    cx: 0.5,
    cy: 0.4,
    type: "fade",
    seconds: 5,
    hold: 3,
  },
  {
    src: "frame-9.jpg",
    cx: 0.5,
    cy: 0.5,
    type: "fade",
    seconds: 8,
    hold: 0,
  },
  {
    src: "frame-10.jpg",
    cx: 0.5,
    cy: 0.5,
    type: "fade",
    seconds: 8,
    hold: 5,
  },
  {
    src: "frame-11.jpg",
    cx: 0.4,
    cy: 0.4,
    type: "fade",
    seconds: 15,
    hold: 0,
  },
  {
    src: "frame-12.jpg",
    cx: 0.5,
    cy: 0.5,
    type: "fade",
    seconds: 8,
    hold: 0,
  },
  {
    src: "frame-13.jpg",
    cx: 0.5,
    cy: 0.5,
    type: "fade",
    seconds: 3,
    hold: 0,
  },
  {
    src: "frame-14.jpg",
    cx: 0.55,
    cy: 0.5,
    type: "fade",
    seconds: 15,
    hold: 0,
  },
  {
    src: "frame-15.jpg",
    cx: 0.55,
    cy: 0.5,
    type: "fade",
    seconds: 10,
    hold: 0,
  },
  {
    src: "frame-15-2.jpg",
    cx: 0.55,
    cy: 0.5,
    type: "fade",
    seconds: 3,
    hold: 0,
  },
  {
    src: "frame-16.jpg",
    cx: 0,
    cy: 0,
    type: "fade",
    seconds: 15,
    hold: 0,
  },
  {
    src: "frame-17.jpg",
    cx: 1,
    cy: 1,
    type: "fade",
    seconds: 15,
    hold: 0,
  },
  {
    src: "finale.jpg",
    cx: 0.5,
    cy: 0.5,
    type: "fade",
    seconds: 15,
    hold: 0,
  },
]

type Frame = Step & {
  canvasRef: React.RefObject<HTMLCanvasElement>,
}

let Script: { [image: string]: Frame } = {}

const getFrame = (i: number): Frame => {
  return Script[SCRIPT_RAW[i].src]
}

const FPS = 60;
const FRAME_TIME = 1000 / FPS
let lastTime: number | null = null

let BLOCK_HOPPER: { [key: string]: Array<any> } = {}
const diamondWorker = new Worker("/worker.js")

diamondWorker.onmessage = (e: any) => {
  window.requestAnimationFrame(() => {
    const { src, blockBuffer }: { src: string, blockBuffer: any } = e.data
    if (typeof BLOCK_HOPPER[src] === "undefined") {
      BLOCK_HOPPER[src] = []
    }
    if (WAIT === src) {
      currentBlocks = Array.from(blockBuffer)
      WAIT = null
    } else {
      BLOCK_HOPPER[src].push(blockBuffer)
    }
  })
}

Script = {}
SCRIPT_RAW.forEach((step: Step) => {
  Script[step.src] = {
    ...step,
    canvasRef: React.createRef<HTMLCanvasElement>()
  }
})
let setScriptPosition = (position: number) => {/* no-op */ }
let OilRenderer: THREE.WebGLRenderer | undefined, OilUniforms: {
  iTime: {
    value: number;
  };
  iResolution: {
    value: THREE.Vector3;
  };
  iCull: {
    value: number;
  }
} | undefined, OilScene: THREE.Scene | null, OilCamera: THREE.OrthographicCamera | null;
const setUpOilCanvas = (canvas: Element) => {
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: false });
  renderer.autoClearColor = false;

  OilCamera = new THREE.OrthographicCamera(
    -1, // left
    1, // right
    1, // top
    -1, // bottom
    -1, // near,
    1, // far
  );
  OilScene = new THREE.Scene();
  const plane = new THREE.PlaneGeometry(2, 2);
  const uniforms = {
    iTime: { value: 0 },
    iResolution: { value: new THREE.Vector3() },
    iCull: { value: 0.1 },
  };
  const material = new THREE.ShaderMaterial({
    fragmentShader,
    uniforms,
    side: THREE.DoubleSide,
  });
  OilScene.add(new THREE.Mesh(plane, material));
  OilRenderer = renderer
  OilUniforms = uniforms
}
const resizeRendererToDisplaySize = () => {
  if (!OilRenderer) return
  const canvas = OilRenderer.domElement;
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;
  const needResize = canvas.width !== width || canvas.height !== height;
  if (needResize) {
    OilRenderer.setSize(width, height, false);
  }
  return needResize;
}

const createWorkerMessage = (dimensions: Dimensions, frame: Frame) => {
  return {
    width: dimensions.width,
    height: dimensions.height,
    totalBlocks: dimensions.totalBlocks,
    cx: dimensions.frame.cx,
    cy: dimensions.frame.cy,
    blockSize: dimensions.blockSize,
    src: frame.src
  }
}
const advanceScript = (stall = false) => {
  if (!stall) {
    POS = POS + 1
    setScriptPosition(POS)
  }
  const frame = getFrame(POS + 1)
  const rawDimensions = getDimensions(frame)
  const nextFrame = getFrame(POS + 2)
  const nextRawDimensions = getDimensions(nextFrame)
  if (rawDimensions) {
    currentDimensions = rawDimensions
    diamondWorker.postMessage(createWorkerMessage(rawDimensions, frame))
  }
  if (nextRawDimensions) {
    diamondWorker.postMessage(createWorkerMessage(nextRawDimensions, nextFrame))
  }
  if (BLOCK_HOPPER[frame.src] && BLOCK_HOPPER[frame.src].length > 0) {
    const currentBuffer = BLOCK_HOPPER[frame.src].pop()
    currentBlocks = Array.from(currentBuffer)
    BLOCK_HOPPER[frame.src].unshift(Array.from(currentBuffer))
  } else {
    WAIT = frame.src
  }
  currentOldBlocks = []
}


const CanvasRef = React.createRef<HTMLCanvasElement>()
const OilCanvasRef = React.createRef<HTMLCanvasElement>()
const getDimensions = (frame: Frame): Dimensions | undefined => {
  const image = frame.canvasRef.current
  const seconds = frame.seconds * TIME_SCALE
  const blockSize = 1
  if (!image) return
  const windowWidth = SCALE * window.innerWidth
  const windowHeight = window.innerHeight
  const imageRatio = image.width / image.height
  const [width, height] = image.height > image.width ? [windowHeight * imageRatio, windowHeight] : [windowWidth, windowWidth / imageRatio]
  const imageBlockFactor = image.width / width
  const totalFrames = seconds * FPS;
  const totalBlocks = Math.ceil((width * height) / (blockSize * blockSize))
  const blocksPerFrame = Math.ceil(totalBlocks / totalFrames)
  return { width, height, image, imageRatio, imageBlockFactor, blocksPerFrame, totalBlocks, frame, blockSize }
}

const step = (timestamp: number) => {
  const { image, imageBlockFactor, blocksPerFrame, blockSize } = currentDimensions
  const delta = lastTime ? timestamp - lastTime : FRAME_TIME
  lastTime = timestamp
  analyserSand.getByteFrequencyData(dataArraySand);
  analyserWater.getByteFrequencyData(dataArrayWater);
  const avgAmp = (dataArraySand[0] + dataArrayWater[0]) / (2 * 255)
  //const ampBlocksPerFrame = Math.ceil(avgAmp * blocksPerFrame)
  const ampBlocksPerFrame = blocksPerFrame;
  //console.log(avgAmp)
  if (currentBlocks && currentBlocks.length > 0 && !WAIT) {
    const numBlocks = Math.min(ampBlocksPerFrame, Math.ceil(ampBlocksPerFrame * delta / FRAME_TIME)) * 2
    const bufferBlocks = currentBlocks.slice(0, numBlocks)
    currentBlocks = currentBlocks.slice(numBlocks)
    currentOldBlocks = currentOldBlocks.concat(bufferBlocks)
    for (let i = 0; i < bufferBlocks.length / 2; i++) {
      const column = bufferBlocks[i * 2]
      const row = bufferBlocks[(i * 2) + 1]
      const dx = column * blockSize
      const dy = row * blockSize
      const sx = column * blockSize * imageBlockFactor
      const sy = row * blockSize * imageBlockFactor
      ctx.drawImage(image, sx, sy, 1, 1, dx, dy, blockSize, blockSize)
    }
  }

  if (OilRenderer && OilUniforms && OilScene && OilCamera) {
    const WEBGL_T = delta * 0.001;
    const canvas = OilRenderer.domElement;
    OilUniforms.iResolution.value.set(canvas.width, canvas.height, 1);
    OilUniforms.iTime.value += WEBGL_T;
    //OilUniforms.iCull.value = 0.1 + (timestamp % 1000 / 1000)
    OilRenderer.render(OilScene, OilCamera);
  }

  window.requestAnimationFrame((t) => {
    if (currentBlocks?.length < 1 && !WAIT) {
      advanceScript()
    }
    step(t)
  })
}


const App = () => {
  const [currentPosition, setCurrentPosition] = React.useState(POS)
  setScriptPosition = setCurrentPosition

  play = React.useRef<boolean>(false)

  React.useEffect(() => {
    if (!CanvasRef.current) return
    const rawContext = CanvasRef.current.getContext('2d')
    if (rawContext) {
      ctx = rawContext
    }
    CanvasRef.current.width = window.innerWidth * SCALE;
    CanvasRef.current.height = window.innerWidth / RATIO;
  }, [])

  React.useEffect(() => {
    if (!OilCanvasRef.current) return
    OilCanvasRef.current.width = window.innerWidth * SCALE;
    OilCanvasRef.current.height = window.innerWidth / RATIO;

    setUpOilCanvas(OilCanvasRef.current)
    resizeRendererToDisplaySize()
  }, [])

  React.useEffect(() => {
    const onClick = () => {
      if (play.current === false) {
        audioCtx.resume()
        play.current = true
        navigator.mediaDevices.enumerateDevices()
          .then(async (devices) => {
            const audioInterfaceSand = devices.find(device => device.kind === "audioinput" && device.label.match("Sand"))
            if (!audioInterfaceSand) return
            const streamSand = await navigator.mediaDevices.getUserMedia({ audio: { deviceId: audioInterfaceSand.deviceId } })
            const sourceSand = audioCtx.createMediaStreamSource(streamSand);
            sourceSand.connect(analyserSand)

            const audioInterfaceWater = devices.find(device => device.kind === "audioinput" && device.label.match("Water"))
            if (!audioInterfaceWater) return
            const streamWater = await navigator.mediaDevices.getUserMedia({ audio: { deviceId: audioInterfaceWater.deviceId } })
            const sourceWater = audioCtx.createMediaStreamSource(streamWater);
            sourceWater.connect(analyserWater)
          })
      }
    }
    window.addEventListener("click", onClick)
    return window.removeEventListener("click", onClick)
  }, [])

  const hiddenImages = Object.values(Script).map(({ src, canvasRef }, i) => {
    return <HiddenImage key={i} i={i} canvasRef={canvasRef} src={src} />
  })
  const bgs = Object.values(Script).map(({ src }, i) => {
    return <BG className="bg" image={src} show={i <= currentPosition} data-image={src} />
  })

  return (
    <Wrapper>
      {bgs}
      {hiddenImages}
      <Canvas width="100%" height="100%" ref={CanvasRef} />
      <OilCanvas width="100%" height="100%" ref={OilCanvasRef} />
    </Wrapper>
  );
}


type HiddenImageProps = {
  i: number,
  src: string
  canvasRef: React.RefObject<HTMLCanvasElement>
}
const HiddenImage = (props: HiddenImageProps) => {
  React.useEffect(() => {
    const image = new Image()
    image.addEventListener('load', () => {
      if (props.canvasRef.current) {
        props.canvasRef.current.width = window.innerWidth * SCALE;
        props.canvasRef.current.height = (window.innerWidth * SCALE) / RATIO;
        const canvasCtx = props.canvasRef.current.getContext('2d')
        const frame = getFrame(props.i)
        const dimensions = getDimensions(frame)
        if (image) {
          canvasCtx?.drawImage(image, 0, 0, props.canvasRef.current.width, props.canvasRef.current.width / (dimensions?.imageRatio || 1))
        }
        if (props.i === POS + 1 && dimensions) {
          window.requestAnimationFrame((time) => {
            advanceScript(true)
            step(time)
          })
        }
      }
    })
    image.src = props.src
  }, [])
  return (
    <>
      <HiddenCanvas ref={props.canvasRef} />
    </>
  )
}

export default App;