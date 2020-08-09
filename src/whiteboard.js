// Original source:

import React, { useRef, useEffect, useState } from 'react';
import './whiteboard.css';

function Whiteboard() {

    const canvasRef = useRef(null)
    const contextRef = useRef(null)
    const [isDrawing, setIsDrawing] = useState(false)
    const [isErasing, setIsErasing] = useState(false);

    useEffect(() => {
        const canvas = canvasRef.current;
        canvas.width = window.innerWidth * 2;
        canvas.height = window.innerHeight * 2;
        canvas.style.width = `${window.innerWidth}px`;
        canvas.style.height = `${window.innerHeight}px`;

        const context = canvas.getContext("2d")
        context.scale(2,2)
        context.lineCap = "round"
        context.strokeStyle = "black"
        context.lineWidth = 5
        contextRef.current = context;
    }, [])

    const startDrawing = ({nativeEvent}) => {
        // const canvas = canvasRef.current;
        const context = contextRef.current;
        if (isErasing) {
            context.strokeStyle = "white";
            context.lineWidth = "20";
        }
        else {
            context.strokeStyle = "black";
            context.lineWidth = 5
        }
        const {offsetX, offsetY} = nativeEvent;
        contextRef.current.beginPath()
        contextRef.current.moveTo(offsetX, offsetY)
        setIsDrawing(true)
    }

    const finishDrawing = () => {
        contextRef.current.closePath()
        setIsDrawing(false)
    }

    const draw = ({nativeEvent}) => {
        if(!isDrawing){
            return;
        }
        const {offsetX, offsetY} = nativeEvent;
        contextRef.current.lineTo(offsetX, offsetY)
        contextRef.current.stroke()
    }

    const setDrawing = () => {
        setIsErasing(false);
    }

    const setErasing = () => {
        setIsErasing(true);
    }

    const clear = () => {
        const context = contextRef.current;
        const canvas = canvasRef.current;
        context.clearRect(0, 0, canvas.width, canvas.height);
    }

    return (
        <div id="whiteboard">
            <div id="buttons">
                <button onClick={setDrawing}>Draw</button>
                <button onClick={setErasing}>Erase</button>
                <button onClick={clear}>Clear Board</button>
            </div>
            <canvas
            onMouseDown={startDrawing}
            onTouchStart={startDrawing}
            onMouseUp={finishDrawing}
            onTouchEnd={finishDrawing}
            onTouchMove={draw}
            onMouseMove={draw}
            ref={canvasRef}
            />
        </div>
    );
}

export default Whiteboard;