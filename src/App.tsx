import React from 'react';
import logo from './logo.svg';
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
const audioCtx = new AudioContext();
const analyserSand = audioCtx.createAnalyser();
analyserSand.fftSize = 32
const analyserWater = audioCtx.createAnalyser();
analyserWater.fftSize = 32
const bufferLength = analyserSand.frequencyBinCount;;
const dataArraySand = new Uint8Array(bufferLength);
const dataArrayWater = new Uint8Array(bufferLength);
const draw = () => {
  requestAnimationFrame(draw);
  analyserSand.getByteFrequencyData(dataArraySand);

  console.log(1)

  for (let i = 0; i < bufferLength; i++) {
    const height = dataArraySand[i] / 255 * 100;
    const bar = document.getElementById(`barSand-${i}`)
    if (bar) {
      bar.style.height = height + "%"
    }
  }

  analyserWater.getByteFrequencyData(dataArrayWater);

  for (let i = 0; i < bufferLength; i++) {
    const height = dataArrayWater[i] / 255 * 100;
    const bar = document.getElementById(`barWater-${i}`)
    if (bar) {
      bar.style.height = height + "%"
    }
  }
}

export const App = () => {
  React.useEffect(() => {
    navigator.mediaDevices.enumerateDevices()
      .then(async (devices) => {
        const audioInterfaceSand = devices.find(device => device.kind === "audioinput" && device.label.match("Sand"))
        if (!audioInterfaceSand) return
        const streamSand = await navigator.mediaDevices.getUserMedia({ audio: { deviceId: audioInterfaceSand.deviceId } })
        const sourceSand = audioCtx.createMediaStreamSource(streamSand);
        sourceSand.connect(analyserSand)
        debugger

        const audioInterfaceWater = devices.find(device => device.kind === "audioinput" && device.label.match("Water"))
        if (!audioInterfaceWater) return
        const streamWater = await navigator.mediaDevices.getUserMedia({ audio: { deviceId: audioInterfaceWater.deviceId } })
        const sourceWater = audioCtx.createMediaStreamSource(streamWater);
        sourceWater.connect(analyserWater)
        draw()
      })
    window.addEventListener("click", () => {
      audioCtx.resume()
    })
  }, [])

  const barsSand = (Array.from(new Array(bufferLength))).map((_, i) => {
    const colors = ["red", "green", "blue"];
    const color = colors[i % colors.length]
    return <Bar id={`barSand-${i}`} key={i} color={color} />
  })

  const barsWater = (Array.from(new Array(bufferLength))).map((_, i) => {
    const colors = ["cyan", "magenta", "yellow"];
    const color = colors[i % colors.length]
    return <Bar id={`barWater-${i}`} key={i} color={color} />
  })

  return (
    <div className="Appo">
      <Bars>
        {barsSand}
      </Bars>
      <Bars>
        {barsWater}
      </Bars>
    </div>
  );
}
