import { React, useState, useEffect } from "react";
import { Scrubber } from "react-scrubber";

import "react-scrubber/lib/scrubber.css";
import "./Scrubber.css"
import { Button, Col, Flex, Row } from "antd";
import { PauseCircleOutlined, PlayCircleOutlined } from '@ant-design/icons';

export default function ScrubberElem(props) {
  const { extent, setDate, mode } = props
  //const { extent, setMois } = props
  const [value, setValue] = useState(extent[0]);
  console.log("value", value)
  const [play, setPlay] = useState(false);

  
   useEffect(() => {
    setDate(String(value))
   }, [value])


  useEffect(() => {
    if (play) {
      const interval = setInterval(() => {
        setValue((prevValue) => {
          if (mode === "mois") {
            // Mode mois : 195001 → 195002 → ... → 195012 → 195101
            let year = Math.floor(prevValue / 100);
            let month = prevValue % 100;
  
            let nextValue = month < 12 ? year * 100 + (month + 1) : (year + 1) * 100 + 1;
            return nextValue > extent[1] ? extent[1] : nextValue;
          } 
          
          else if (mode === "annees") {
            // Mode années : 1950 → 1951 → 1952 ...
            let nextValue = prevValue + 1;
  
            // Vérifier qu'on ne dépasse pas l'année max
            return nextValue > extent[1] ? extent[1] : nextValue;
          }
  
          return prevValue; // Sécurité en cas de mode inconnu
        });
      }, 1000);
  
      return () => clearInterval(interval);
    }
  }, [play, extent, mode]);

  useEffect(() => {
    setValue((prevValue) => {
      if (mode === "annees" && prevValue > 9999) {
        // On passe de 'mois' à 'annees' : garder seulement l'année
        return Math.floor(prevValue / 100); // Ex: 197003 -> 1970
      } 
      if (mode === "mois" && prevValue < 10000) {
        // On passe de 'annees' à 'mois' : on se place en janvier de cette année
        return prevValue * 100 + 1; // Ex: 1970 -> 197001
      }
      return prevValue; // Si déjà bien formaté, on ne change rien
    });
  }, [mode]); 
  
  
  const playBtn = (e) => {

    setPlay(!play);
  };

  // Générer toutes les dates valides entre extent[0] et extent[1]
  const generateValidDates = (start, end, mode) => {
    let dates = [];
  
    if (mode === "mois") {
      // Mode 'mois' : génère YYYYMM
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
    } else if (mode === "annees") {
      // Mode 'annees' : génère directement YYYY
      for (let year = start; year <= end; year++) {
        dates.push(year);
      }
    }
  
    return dates;
  };
  

  const validDates = generateValidDates(extent[0], extent[1], mode);

  const findClosestValidDate = (val, validDates) => {
    return validDates.reduce((prev, curr) =>
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
          min={validDates[0]}
          max={validDates[validDates.length - 1]}
          value={value}
          onScrubStart={(val) => setValue(findClosestValidDate(val, validDates))}
          onScrubEnd={(val) => setValue(findClosestValidDate(val, validDates))}
          onScrubChange={(val) => setValue(findClosestValidDate(val, validDates))}
        />


        </div>
        {value}
      </Col>
    </Row>
  );
}