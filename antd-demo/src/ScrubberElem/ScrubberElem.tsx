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
  
   useEffect(() => {
     setMois(String(value))
   }, [value])

  useEffect(() => {
    // Implementing the setInterval method only if play is true
    if (play) {
      const interval = setInterval(() => {
        setValue((prevValue) => {
          let year = Math.floor(prevValue / 100); // Extraction de l'année
          let month = prevValue % 100; // Extraction du mois
      
          if (month < 12) {
            return year * 100 + (month + 1); // Incrémentation du mois
          } else {
            return (year + 1) * 100 + 1; // Passage à l'année suivante (mois = 01)
          }
        });
      }, 1000);
      
      return () => clearInterval(interval);
    }
  }, [play]);

  const playBtn = (e) => {

    setPlay(!play);
  };

  console.log(extent, value)

  // Générer toutes les dates valides entre extent[0] et extent[1]
  const generateValidMonths = (start, end) => {
    let dates = [];
    let year = Math.floor(start / 100);
    let month = start % 100;

    while (year * 100 + month <= end) {
      dates.push(year * 100 + month);
      if (month < 12) {
        month += 1;
      } else {
        month = 1;
        year += 1;
      }
    }
    return dates;
  };

  const validMonths = generateValidMonths(extent[0], extent[1]);

  // Fonction pour trouver la date valide la plus proche
  const findClosestValidMonth = (val) => {
    return validMonths.reduce((prev, curr) =>
      Math.abs(curr - val) < Math.abs(prev - val) ? curr : prev
    );
  };


  return (
    <Row gutter={[16, 24]} style={{width: "100%"}}>
      <Col span={24}>

        <Button color='default' 
          variant="solid"
          shape="round" 
          icon={play ? <PauseCircleOutlined /> : <PlayCircleOutlined />} 
          size={'large'}
          onClick={playBtn}
          >
        {play ? "Pause" : "Play"}
        </Button>

      </Col>

      <Col className="content-container" span={24}>

        <div className="scrubber-container" style={{ height: "20px" }}>
          <Scrubber
            min={validMonths[0]}
            max={validMonths[validMonths.length - 1]}
            value={value}
            onScrubStart={(val) => setValue(findClosestValidMonth(val))}
            onScrubEnd={(val) => setValue(findClosestValidMonth(val))}
            onScrubChange={(val) => setValue(findClosestValidMonth(val))}
          />

        </div>
        {value}
      </Col>
    </Row>
  );
}