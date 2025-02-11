import { React, useState, useEffect } from "react";
import { Scrubber } from "react-scrubber";

import "react-scrubber/lib/scrubber.css";
import "./Scrubber.css"
import { Button, Col, Flex, Row } from "antd";
import { PauseCircleOutlined, PlayCircleOutlined } from '@ant-design/icons';

export default function ScrubberElem(props) {
  const { extent, setMois } = props
  const [value, setValue] = useState(extent[0]);
  const [play, setPlay] = useState(false);

  let handleScrubStart = (value: number) => {
    setValue(Math.round(value));
  };

  let handleScrubEnd = (value: number) => {
    setValue(Math.round(value));
  };

  let handleScrubChange = (value: number) => {
    setValue(Math.round(value));
  };

  // useEffect(() => {
  //   setMois(String(value))
  // }, [value])

  useEffect(() => {
    // Implementing the setInterval method only if play is true
    if (play) {
      const interval = setInterval(() => {
        setValue((prevValue) => (prevValue < extent[1] && prevValue >= extent[0]) ? prevValue + 1 : extent[0]);
      }, 1000);

      // Clearing the interval
      return () => clearInterval(interval);
    }
  }, [play]);

  const playBtn = (e) => {

    setPlay(!play);
  };

  console.log(extent, value)

  return (
    <Row gutter={[16, 24]} style={{width: "100%"}}>
      <Col span={24}>

        <Button color='default' 
          variant="solid"
          shape="round" 
          icon={play ? <PlayCircleOutlined /> : <PauseCircleOutlined />} 
          size={'large'}
          onClick={playBtn}
          >
        {play ? "Pause" : "Play"}
        </Button>

      </Col>

      <Col className="content-container" span={24}>

        <div className="scrubber-container" style={{ height: "20px" }}>
          <Scrubber
            min={extent[0]}
            max={extent[1]}
            value={value}
            onScrubStart={handleScrubStart}
            onScrubEnd={handleScrubEnd}
            onScrubChange={handleScrubChange}
          />
        </div>
        {value}
      </Col>
    </Row>
  );
}