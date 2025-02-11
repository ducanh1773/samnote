import React, { useState, useContext, useRef } from "react";
import { Stage, Layer, Rect, Line } from "react-konva";
import { Box, TextField } from "@mui/material";
import Button from "@mui/material/Button";
import { SketchPicker } from "react-color";
import "react-datepicker/dist/react-datepicker.css";
import { format } from "date-fns";
import html2canvas from "html2canvas";
import api from "../api";
import axios from "axios";
import DatePicker from "react-datepicker";
import { AppContext } from "../context";

const UserSketch = () => {
  const appContext = useContext(AppContext);
  const { user, setSnackbar } = appContext;
  const [lines, setLines] = useState([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState("black");
  const [lineWidth, setLineWidth] = useState(2);
  const [selectedColor, setSelectedColor] = useState("black");
  const [isEraserActive, setIsEraserActive] = useState(false);
  const [title, setTitle] = useState("");
  const [remindAt, setRemindAt] = useState(null);
  const [colorNote, setColorNote] = useState({
    r: "255",
    g: "255",
    b: "255",
    a: "1",
  });
  const [displayColorPicker, setDisplayColorPicker] = useState(false);

  const toggleEraser = () => {
    setIsEraserActive(!isEraserActive);
  };

  const handleMouseDown = (event) => {
    setIsDrawing(true);
    const { offsetX, offsetY } = event.target.getStage().getPointerPosition();
    setLines([
      ...lines,
      {
        points: [offsetX, offsetY],
        color: isEraserActive ? "white" : color,
        width: isEraserActive ? 10 : lineWidth,
      },
    ]);
  };

  const handleUndo = () => {
    if (lines.length > 0) {
      setLines(lines.slice(0, -1));
    }
  };

  const handleMouseMove = (event) => {
    if (!isDrawing) return;

    const stage = event.target.getStage();
    const point = stage.getPointerPosition();
    let lastLine = lines[lines.length - 1];

    if (lastLine) {
      if (!lastLine.points) {
        lastLine.points = [];
      }
      lastLine.points = lastLine.points.concat([point.x, point.y]);
      setLines([...lines.slice(0, lines.length - 1), lastLine]);
    }
  };
  const outputDate = format(new Date(remindAt), "yyyy/M/d HH:mm:ss");
  const stageRef = useRef(null);

  const uploadImage = async () => {
    try {
      // Capture screenshot of the current view
      const canvas = await html2canvas(document.getElementById("screenshot"));
      const imageData = canvas.toDataURL("image/png");

      // Convert data URL to Blob
      const byteCharacters = atob(imageData.split(",")[1]);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: "image/png" });

      // Create a File object from the Blob
      const file = new File([blob], "screenshot.png", { type: "image/png" });

      // Prepare payload for server upload
      const payload = {
        type: "image",
        image_note: file,
        title: "Your title here", // Replace with your actual title variable
        r: colorNote.r,
        g: colorNote.g,
        b: colorNote.b,
        a: colorNote.a,
        content: "dfsdf",
        remind: outputDate ? outputDate : null,
      };

      // Prepare FormData for fetch
      const formPayload = new FormData();
      formPayload.append("image_note", file);
      formPayload.append("type", "image");
      formPayload.append("title", payload.title);
      formPayload.append("r", payload.r);
      formPayload.append("g", payload.g);
      formPayload.append("b", payload.b);
      formPayload.append("a", payload.a);
      formPayload.append("content", payload.content);
      if (payload.remind) {
        formPayload.append("remind", payload.remind);
      }

      // Send FormData to server using fetch
      const response = await fetch(
        `https://samnote.mangasocial.online/new-note-image/${user.id}`,
        {
          method: "POST",
          body: formPayload,
        }
      );

      if (response.ok) {
        setSnackbar({
          isOpen: true,
          message: "Save note successfully ",
          severity: "success",
        });
      } else {
        setSnackbar({
          isOpen: true,
          message: "Failed to save note ",
          severity: "error",
        });
      }
    } catch (error) {
      setSnackbar({
        isOpen: true,
        message: "Failed to save note ",
        severity: "error",
      });
    }
  };

  const downloadImage = async () => {
    try {
      // Capture screenshot of the current view
      const canvas = await html2canvas(document.getElementById("screenshot"));
      const imageData = canvas.toDataURL("image/png");

      // Download the image locally
      const downloadLink = document.createElement("a");
      downloadLink.href = imageData;
      downloadLink.download = "screenshot.png";
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
    } catch (error) {
      setSnackbar({
        isOpen: true,
        message: "Failed to dowload image ",
        severity: "error",
      });
    }
  };

  const handleMouseUp = () => {
    setIsDrawing(false);
  };

  const handleColorChange = (newColor) => {
    setColor(newColor);
    setSelectedColor(newColor);
  };

  const handleWidthChange = (newValue) => {
    setLineWidth(newValue);
  };

  const handleClick = () => {
    setDisplayColorPicker(!displayColorPicker);
  };

  const handleClose = () => {
    setDisplayColorPicker(false);
  };

  const handleChange = (color) => {
    setColorNote(color.rgb);
  };

  const boardWidth = window.innerWidth - 267;
  const boardHeight = 500;

  return (
    <Box sx={{}}>
      <div className="flex flex-wrap items-center justify-between px-2 py-3">
        <h3 className="uppercase">create note image</h3>{" "}
        <Button
          className="mx-4"
          variant="contained"
          sx={{ height: "40px" }}
          onClick={uploadImage}
        >
          create
        </Button>
      </div>
      <div className="flex flex-wrap items-center ">
        <TextField
          className="w-full md:w-1/3 lg:w-1/4 xl:w-1/4 mx-2 my-2"
          label="Title"
          size="small"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <div
          className="w-full md:w-1/3 lg:w-1/4 xl:w-1/4 mx-2 my-2"
          style={{
            padding: "5px",
            background: "#fff",
            borderRadius: "3px",
            boxShadow: "0 0 0 1px rgba(0,0,0,.1)",
            cursor: "pointer",
            display: "flex",
            height: "39px",
          }}
          onClick={handleClick}
        >
          Background-color:
          <div
            style={{
              width: "36px",
              height: "100%",
              border: "0.1px solid black",
              marginLeft: "5px",
              borderRadius: "2px",
              background: `rgba(${colorNote.r}, ${colorNote.g}, ${colorNote.b}, ${colorNote.a})`,
            }}
          />
        </div>
        {displayColorPicker && (
          <div
            style={{
              position: "absolute",
              right: "45%",
              top: "50px",
              zIndex: "50",
            }}
          >
            <div
              style={{
                position: "fixed",
                top: "0px",
                right: "0px",
                bottom: "0px",
                left: "0px",
              }}
              onClick={handleClose}
            />
            <SketchPicker color={color} onChange={handleChange} />
          </div>
        )}
        <Box className="flex items-center w-full md:w-1/3 lg:w-1/4 xl:w-1/4 z-50 mx-4 my-2">
          <h6>RemindAt:</h6>
          <DatePicker
            selected={remindAt}
            onChange={(date) => setRemindAt(date)}
            showTimeSelect
            dateFormat="Pp"
          />
        </Box>
      </div>

      <div>
        <div
          id="screenshot"
          ref={stageRef}
          style={{
            width: boardWidth,
            borderBottom: "1px solid black",
            borderTop: "1px solid black",
            height: boardHeight,
            overflow: "hidden",
          }}
        >
          <Stage
            width={boardWidth}
            height={boardHeight}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
          >
            <Layer>
              <Rect width={boardWidth} height={boardHeight} fill="white" />
              {lines.map((line, i) => (
                <Line
                  key={i}
                  points={line.points}
                  stroke={line.color}
                  strokeWidth={line.width}
                  tension={0.5}
                  lineCap="round"
                />
              ))}
            </Layer>
          </Stage>
        </div>{" "}
        <div className="flex items-center justify-center py-2">
          <Box
            className="list-button"
            sx={{
              width: "fit-content",
              height: "fit-content",
              padding: "0 40px",
              borderRadius: "40px",
              zIndex: "20",
              backgroundColor: "#999",
              display: "flex",
              color: "text.main",
              flexDirection: "row",
              justifyContent: "space-evenly",
            }}
          >
            <div style={{ display: "flex", alignItems: "center" }}>
              <button
                className="color-button"
                style={{
                  backgroundColor: "#0000FF",
                  width: "20px",
                  height: "20px",
                  margin: "5px",
                  borderRadius: "50%",
                  cursor: "pointer",
                  border:
                    selectedColor === "#0000FF"
                      ? "3px solid #fff"
                      : "0.5px solid #fff",
                }}
                onClick={() => handleColorChange("#0000FF")}
              />
              <button
                className="color-button"
                style={{
                  backgroundColor: "#FF0000",
                  width: "20px",
                  height: "20px",
                  margin: "5px",
                  borderRadius: "50%",
                  cursor: "pointer",
                  border:
                    selectedColor === "#FF0000"
                      ? "3px solid #fff"
                      : "0.5px solid #fff",
                }}
                onClick={() => handleColorChange("#FF0000")}
              />
              <button
                className="color-button"
                style={{
                  backgroundColor: "#800080",
                  width: "20px",
                  height: "20px",
                  margin: "5px",
                  borderRadius: "50%",
                  cursor: "pointer",
                  border:
                    selectedColor === "#800080"
                      ? "3px solid #fff"
                      : "0.5px solid #fff",
                }}
                onClick={() => handleColorChange("#800080")}
              />
              <button
                className="color-button"
                style={{
                  backgroundColor: "#FFFF00",
                  width: "20px",
                  height: "20px",
                  margin: "5px",
                  borderRadius: "50%",
                  cursor: "pointer",
                  border:
                    selectedColor === "#FFFF00"
                      ? "3px solid #fff"
                      : "0.5px solid #fff",
                }}
                onClick={() => handleColorChange("#FFFF00")}
              />
              <button
                className="color-button"
                style={{
                  backgroundColor: "#000000",
                  width: "20px",
                  height: "20px",
                  margin: "5px",
                  borderRadius: "50%",
                  cursor: "pointer",
                  border:
                    selectedColor === "#000000"
                      ? "3px solid #fff"
                      : "0.5px solid #fff",
                }}
                onClick={() => handleColorChange("#000000")}
              />
            </div>
            <div
              style={{
                marginLeft: "20px",
                display: "flex",
                alignItems: "center",
                height: "80px",
              }}
            >
              <button
                style={{
                  margin: "0",
                  padding: "0 2px",

                  cursor: "pointer",
                  borderColor: "#f2f2f2",

                  backgroundColor: "#999",
                  transform: lineWidth === 2 ? "scale(1.1)" : "scale(0.8)",
                }}
                onClick={() => handleWidthChange(2)}
              >
                1X
              </button>
              <button
                style={{
                  margin: "0 10px",
                  cursor: "pointer",
                  backgroundColor: "#999",
                  borderColor: "#f2f2f2",
                  padding: "0 2px",
                  transform: lineWidth === 4 ? "scale(1.1)" : "scale(0.8)",
                }}
                onClick={() => handleWidthChange(4)}
              >
                2X
              </button>{" "}
              <button
                style={{
                  margin: "0",
                  padding: "0 2px",

                  cursor: "pointer",
                  backgroundColor: "#999",
                  borderColor: "#f2f2f2",

                  transform: lineWidth === 8 ? "scale(1.1)" : "scale(0.8)",
                }}
                onClick={() => handleWidthChange(8)}
              >
                4X
              </button>{" "}
            </div>
            <div
              style={{
                marginLeft: "20px",
                whiteSpace: "nowrap",
                display: "flex",
                alignItems: "center",
                justifyContent: "flex-end",
              }}
            >
              <Button variant="outlined" onClick={handleUndo}>
                undo
              </Button>
            </div>
            <div
              style={{
                marginLeft: "10px",
                whiteSpace: "nowrap",
                display: "flex",
                alignItems: "center",
                justifyContent: "flex-end",
              }}
            >
              <Button variant="contained" onClick={downloadImage}>
                dowload img
              </Button>
            </div>
          </Box>
        </div>
      </div>
    </Box>
  );
};

export default UserSketch;
