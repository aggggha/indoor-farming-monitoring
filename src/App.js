import { useEffect, useState } from 'react';
import { Container, Grid, Header, Icon, Placeholder, Segment, Label as SemanticLabel, Popup } from 'semantic-ui-react';
import 'semantic-ui-css/semantic.min.css';
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { capitalizeFirstChar } from './libs/Strings';

export const App = () => {
  const [sensorLog, setSensorLog] = useState([]);
  const [sensorPropsLog, setSensorPropsLog] = useState({});
  const [devieList, setdeviceList] = useState([]);
  const [sensorFuzz, setSensorFuzz] = useState({});
  const [initLoading, setInitLoading] = useState(true);

  // Websocket connection
  // For DHT11
  useEffect(() => {
    let tempJSONFormat = {};
    const webSocketDHT = new WebSocket("ws://192.168.137.66/things/DHT11");
    const webSocketLDR = new WebSocket("ws://192.168.137.66/things/LDR");

    // References:
    // https://tkdodo.eu/blog/using-web-sockets-with-react-query
    // https://dev.to/muratcanyuksel/using-websockets-with-react-50pi
    // Identifier(?)
    // const wsCall = {
    //   event: "bts:subscribe",
    //   data: { channel: "webthing_device" },
    // };

    // Open websocket connection
    webSocketDHT.onopen = (e) => {
      // webSocket.send(JSON.stringify(wsCall));
      console.log("Connected to device (DHT11)");
    }

    webSocketLDR.onopen = (e) => {
      // webSocket.send(JSON.stringify(wsCall));
      console.log("Connected to device (LDR)");
    }

    // Receive websocket message from device
    webSocketDHT.onmessage = (e) => {
      const json = JSON.parse(e.data);
      try {
        tempJSONFormat = { ...tempJSONFormat, ...json.data }
      } catch (e) {
        console.log(e);
      }
    }

    webSocketLDR.onmessage = (e) => {
      const json = JSON.parse(e.data);
      try {
        json.data = Object.entries(json.data).map(([key, value]) => { return { [key]: (value / 1024 * 100) } })[0];
        const date = new Date();
        const time = `${date.getHours() < 10 ? `0${date.getHours()}` : date.getHours()}:${date.getMinutes() < 10 ? `0${date.getMinutes()}` : date.getMinutes()}:${date.getSeconds() < 10 ? `0${date.getSeconds()}` : date.getSeconds()}`
        json.data.time = time;
        tempJSONFormat = { ...tempJSONFormat, ...json.data }
        setSensorLog(prevState => ([...prevState, tempJSONFormat]));
        setInitLoading(false);
      } catch (e) {
        console.log(e);
      }
    }

    const getSensorProperties = async () => {
      try {
        const deviceList = await fetch('http://192.168.137.66/');
        const resDeviceList = await deviceList.json();

        for (let i = 0; i < resDeviceList.length; i++) {
          const propsList = await fetch(`http://192.168.137.66/things/${resDeviceList[i].id}`);
          const resPropsList = await propsList.json();
          setSensorPropsLog(prevState => ({ ...prevState, ...resPropsList.properties }));
        }
      } catch (e) {
        console.log(e)
      }
    }

    getSensorProperties();

    return () => {
      webSocketDHT.close();
      webSocketLDR.close();
    }
  }, []);

  return (
    <div className="App">
      <Container style={{ width: '80%' }}>
        <Header as='h1' style={{ padding: '40px 0 20px', margin: '10px 0 40px', fontSize: '3em' }}>Indoor Farming Monitoring Dashboard</Header>

        <Grid columns='equal'>
          <Header>Devices</Header>
          <Grid.Row columns='equal'>
            {initLoading ? (
              <>
                <Grid.Column width={4}>
                  <Placeholder style={{ height: 150 }} fluid>
                    <Placeholder.Image />
                  </Placeholder>
                </Grid.Column>
              </>
            ) : (
              Object.entries(sensorLog[sensorLog.length - 1]).map(([key, value], i) => {
                let background;
                let icons;
                let logicDecisions;
                switch (key) {
                  case 'humidity':
                    if (value < 50) {
                      logicDecisions = { text: 'Dry', color: 'brown' };
                    } else if (value >= 50 && value < 70) {
                      logicDecisions = { text: 'Moderate', color: 'orange' };
                    } else {
                      logicDecisions = { text: 'Humid', color: 'blue' };
                    }
                    icons = 'tint';
                    background = <div className='sensor-loader' style={{ position: 'absolute', top: 0, left: 0, width: `${value}%`, height: '100%', background: 'lightblue' }}></div>;
                    break;
                  case 'temperature':
                    icons = 'thermometer half';
                    if (value < 18.3) {
                      logicDecisions = { text: 'Cold', color: 'blue' };
                    } else if (value >= 18.3 && value < 32.2) {
                      logicDecisions = { text: 'Moderate', color: 'green' };
                    } else {
                      logicDecisions = { text: 'Hot', color: 'red' };
                    }
                    break;
                  case 'intensity':
                    icons = 'adjust';
                    background = <div className='sensor-loader' style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', background: `rgba(230, 230, 230, ${100 - value}%)` }}></div>
                  default:
                    break;
                }

                if (key !== 'time') {
                  return (
                    <Grid.Column width={4} key={i}>
                      <Segment padded style={{ position: 'relative', borderRadius: 8, boxShadow: '0 5px 15px rgba(0, 0, 0, .05)', overflow: 'hidden' }}>
                        <div style={{ position: 'relative', zIndex: 2 }}>
                          <Grid columns='equal' verticalAlign='middle'>
                            <Grid.Column><Header>{key === 'intensity' && 'Light '}{capitalizeFirstChar(key)}</Header></Grid.Column>
                            <Grid.Column width={6} textAlign='right'><Icon name={icons} size='big' color='blue' /></Grid.Column>
                          </Grid>
                          <Header as='h1' {...((key === 'temperature' && logicDecisions !== undefined) && {color: logicDecisions.color})} style={{ fontSize: '3em', marginTop: 10, marginBottom: 25 }}>{value.toFixed(2)}{key === 'temperature' ? `°${sensorPropsLog[key].unit}` : sensorPropsLog[key].unit}</Header>
                          <Header as='h4' style={{ marginBottom: 5 }}>First data received at</Header>
                          <div>{sensorLog[0].time}</div>
                          {key === 'intensity' && (
                            <div style={{ position: 'absolute', display: 'flex', bottom: 0, right: 0, gap: '3px' }}>
                              <Popup content='Brightest color indicator' size='mini' position='top center' trigger={<div style={{ width: '20px', height: '20px', background: '#ffffff', border: '1px solid #aaaaaa', boxShadow: 'inset 0 0 0 1px #ffffff', borderRadius: '50%' }}></div>} />
                              <Popup content='Darkest color indicator' size='mini' position='top center' trigger={<div style={{ width: '20px', height: '20px', background: '#e6e6e6', border: '1px solid #aaaaaa', boxShadow: 'inset 0 0 0 1px #ffffff', borderRadius: '50%' }}></div>} />
                            </div>
                          )}
                          {logicDecisions !== undefined && <SemanticLabel style={{ position: 'absolute', display: 'flex', bottom: 0, right: 0, gap: '3px' }} color={logicDecisions.color}>{logicDecisions.text}</SemanticLabel>}
                        </div>
                        <div style={{ borderRadius: '8px', position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: '1px solid rgba(255, 255, 255, .7)', zIndex: 1 }}></div>

                        {background}
                      </Segment>
                    </Grid.Column>
                  )
                }
              })
            )}
          </Grid.Row>

          <Header>Detailed Graph</Header>
          <Grid.Row>
            {initLoading ? (
              <Grid.Column width={4}>
                <Placeholder style={{ height: 300 }} fluid>
                  <Placeholder.Image />
                </Placeholder>
              </Grid.Column>
            ) : (
              Object.entries(sensorLog[sensorLog.length - 1]).map(([key, value], i) => {
                if (key !== 'time' && key !== 'intensity') {
                  return (
                    <Grid.Column key={i}>
                      <Segment padded style={{ borderRadius: 8, boxShadow: '0 5px 15px rgba(0, 0, 0, .05)' }}>
                        <Header style={{ paddingBottom: 20 }}>
                          {capitalizeFirstChar(key)} Graph
                          <SemanticLabel size='tiny' color='pink'>Live</SemanticLabel>
                          <SemanticLabel size='tiny' color='blue'>Avg.<SemanticLabel.Detail>{(sensorLog.map(log => log[key]).reduce((a, b) => a + b, 0) / sensorLog.length).toFixed(2)}{key === 'temperature' ? `°${sensorPropsLog[key].unit}` : sensorPropsLog[key].unit}</SemanticLabel.Detail></SemanticLabel>
                        </Header>
                        <ResponsiveContainer width='100%' height={300}>
                          <LineChart data={sensorLog}>
                            <Line type='monotone' dataKey={key} stroke='#ff0000' />
                            <CartesianGrid stroke='#cccccc' strokeDasharray='5 5' />
                            <XAxis dataKey='time' angle='45' label={{ value: 'Time (HH:MM:SS)', position: 'insideBottom', offset: -5, textAnchor: 'middle' }} />
                            <YAxis label={{ value: key === 'temperature' ? `°${sensorPropsLog[key].unit}` : sensorPropsLog[key].unit, position: 'insideLeft', textAnchor: 'middle' }} />
                            <Tooltip />
                          </LineChart>
                        </ResponsiveContainer>
                      </Segment>
                    </Grid.Column>
                  )
                }
              })
            )}
          </Grid.Row>
        </Grid>
      </Container>
    </div>
  );
}

export default App;
