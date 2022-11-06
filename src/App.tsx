import React from 'react';
import * as THREE from 'three';
import './App.css';
import styled from "styled-components";

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
const Scrim = styled.div`
  position: fixed;
  left: 0;
  top: 0;
  width:100vw;
  height: 100vw;
  background-color: white;
  z-index:10;
  mix-blend-mode: multiply;
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


const SCALE = 1;
const RATIO = 2.16454997239;
const TIME_SCALE = 0.5
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

const HiddenIMG = styled.img`
  display: none;
`

const HiddenCanvas = styled.canvas`
  display: none;
`

const Canvas = styled.canvas`
  position: absolute;
  top:0;
  left:0
`

const Wrapper = styled.div`
  position: relative;
  height: 100vh;
  width: 100vw;
`

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
    console.log(BLOCK_HOPPER[frame.src])
    const currentBuffer = BLOCK_HOPPER[frame.src].pop()
    currentBlocks = Array.from(currentBuffer)
    BLOCK_HOPPER[frame.src].unshift(Array.from(currentBuffer))
  } else {
    WAIT = frame.src
  }
  currentOldBlocks = []
}


const CanvasRef = React.createRef<HTMLCanvasElement>()
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
  const ampBlocksPerFrame = Math.ceil(avgAmp * blocksPerFrame)
  //const ampBlocksPerFrame = blocksPerFrame * Math.random()
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
  const scrim = document.getElementById("scrim")
  if (scrim) {
    scrim.style.backgroundColor = `rgba(${255 - dataArraySand[0]},255,${255 - dataArrayWater[0]},1)`
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
    window.addEventListener("click", () => {
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
    })
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
      <Scrim id="scrim" />
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