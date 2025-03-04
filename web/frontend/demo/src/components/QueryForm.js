import './QueryForm.css';
import Form from 'react-bootstrap/Form';




import React, {useState, useRef} from 'react';
import ShowQueryTable from "./ShowQueryTable";
import {ButtonGroup, Col, Row} from "react-bootstrap";
import {Button, Select} from "antd";
import Container from "react-bootstrap/Container";
import QueryView from "./QueryView";


import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale , registerables} from 'chart.js';
import {Chart, Doughnut, Line} from 'react-chartjs-2';
import annotationPlugin from 'chartjs-plugin-annotation';
import {MDBInputGroup} from "mdb-react-ui-kit";

ChartJS.register(ArcElement, Tooltip, Legend, annotationPlugin, CategoryScale, ...registerables);

const doughnutConfig = {
  labels: [],
  datasets: [
    {
      label: 'Weight',
      data: [],
      backgroundColor: [
        'rgba(255, 99, 132, 0.2)',
        'rgba(54, 162, 235, 0.2)',
        'rgba(255, 206, 86, 0.2)',
        'rgba(75, 192, 192, 0.2)',
        'rgba(153, 102, 255, 0.2)',
        'rgba(255, 159, 64, 0.2)',
        'rgba(249,64,255,0.2)',
        'rgba(39,237,25,0.2)',
      ],
      borderColor: [
        'rgba(255, 99, 132, 1)',
        'rgba(54, 162, 235, 1)',
        'rgba(255, 206, 86, 1)',
        'rgba(75, 192, 192, 1)',
        'rgba(153, 102, 255, 1)',
        'rgba(255, 159, 64, 1)',
        'rgba(249,64,255,1)',
        'rgba(39,237,25,1)',
      ],
      borderWidth: 1,
    },
  ],
};


function QueryForm({
                             formFields, setFormFields,
                             formConstraints, setFormConstraints,
                             table, setTable,
                             tableFields, setTableFields,
                             query, setQuery,
                             originalQueryResults, setOriginalQueryResults,
                             refinements, setRefinements,
                             err, setErr,
                             optionalOperators
                         }) {

    const [DBPreview, setDBPreview] = useState([]);
    const [DBPreviewLoading, setDBPreviewLoading] = useState(false);
    const [selectedTuple, setSelectedTuple] = useState(0)
    const [k, setK] = useState(10)

    const [satAns, setSatAns] = useState(undefined);
    const [bestAns, setBestAns] = useState(undefined);
    const [pointAns, setPointAns] = useState(undefined);
    const [boxAns, setBoxAns] = useState(undefined);
    const [boxAttrNumber1, setBoxAttrNumber1] = useState(0);
    const [boxAttrNumber2, setBoxAttrNumber2] = useState(1);
    const [weightConstraintsType, setWeightConstraintsType] = useState("triangle");
    const [userWeightConstraints, setUserWeightConstraints] = useState([
        {attribute: '', lower_bound: '', upper_bound: ''}
    ]);
    const [selectedBoxVisualization, setSelectedBoxVisualization] = useState("Bar Chart");

    const ref = useRef();


    const prepareUserWeightConstraints = () => {
        return userWeightConstraints.filter(c => c.attribute !== '' && c.upper_bound !== '' && c.lower_bound !== '').map(c => {
            return {attribute: c.attribute, lower_bound: parseInt(c.lower_bound), upper_bound: parseInt(c.upper_bound)}
        });
    };
    const handleUserWeightConstraintsChange = (event, index) => {
        let data = [...userWeightConstraints];
        console.log(event);
        data[index][event.target.name] = event.target.value;
        setUserWeightConstraints(data);
    }

    const sendSatRequest = async (tuple_id) => {
        await fetch('http://127.0.0.1:8000/explain/sat', {
                method: 'POST',
                body: JSON.stringify(
                    {
                      "dataset": table,
                      "tuple_id": tuple_id,
                      "k": k,
                      "weight_constraints": weightConstraintsType,
                      "user_weight_constraints": prepareUserWeightConstraints()
                    }
                ),
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                }}).then(response => response.json()).then(response => {
                    setSatAns(response);
                    console.log("SAT ANSWER: " + response)
        });
    }
    const sendBestRequest = async (tuple_id) => {
        await fetch('http://127.0.0.1:8000/explain/best', {
                method: 'POST',
                body: JSON.stringify(
                    {
                      "dataset": table,
                      "tuple_id": tuple_id,
                      "k": k,
                      "weight_constraints": weightConstraintsType,
                      "user_weight_constraints": prepareUserWeightConstraints()
                    }
                ),
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                }}).then(response => response.json())
                    .then(response => {
                        setBestAns(response);
                        // console.log(response)
        })};

    const getNumericAttrs = () => {
        return DBPreview.attributes.filter(attr => attr.numeric).map(attr => attr.name);
    }

    const sendPointRequest = async (tuple_id) => {
        await fetch('http://127.0.0.1:8000/explain/point', {
                method: 'POST',
                body: JSON.stringify(
                    {
                      "dataset": table,
                      "tuple_id": tuple_id,
                      "k": k,
                      "weight_constraints": weightConstraintsType,
                      "user_weight_constraints": prepareUserWeightConstraints()
                    }
                ),
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                }}).then(response => response.json())
                    .then(response => {
                        const config = doughnutConfig;
                        config.labels = getNumericAttrs();
                        const len = response.coordinates.length;
                        config.datasets[0].data = response.coordinates;
                        config.datasets[0].backgroundColor = doughnutConfig.datasets[0].backgroundColor.slice(0, len);
                        config.datasets[0].borderColor = doughnutConfig.datasets[0].borderColor.slice(0, len);
                        return config;
        }).then(config => {
            setPointAns(config);
            const len = config.datasets[0].data.length;
            console.log( config);
            })};

    const sendBoxRequest = async (tuple_id) => {
        await fetch('http://127.0.0.1:8000/explain/box', {
                method: 'POST',
                body: JSON.stringify(
                    {
                      "dataset": table,
                      "tuple_id": tuple_id,
                      "k": k,
                      "weight_constraints": weightConstraintsType,
                      "user_weight_constraints": prepareUserWeightConstraints()
                    }
                ),
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                }}).then(response => response.json())
                    .then(response => {
                        setBoxAns(response);
                        console.log(response)
        })};


    const sendRequests = async (tuple_id) => {
        await sendSatRequest(tuple_id);
        if(satAns !== false){
            await sendPointRequest(tuple_id);
        }
        await sendBestRequest(tuple_id);
        await sendBoxRequest(tuple_id);
    }

    const onClickSelectedTuple = async (i) => {
        console.log('tuple id '+ i);
        await setSelectedTuple(i);
        await sendRequests(i);
    }


    const reset = () => {

        setUserWeightConstraints([])
    }

    const addUserWeightConstraint = () => {
        let object = {
            attribute: '',
            lower_bound:'',
            upper_bound: ''
        }
        setUserWeightConstraints([...userWeightConstraints, object])
    }

    const removeUserWeightConstraint = (index) => {
        let data = [...userWeightConstraints];
        data.splice(index, 1)
        setUserWeightConstraints(data)
    }

    async function sendDBPreviewRequest(table) {
        try {
            const db_priview_response = await fetch('http://127.0.0.1:8000/datasets/' + table, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                }});



            if (!db_priview_response.ok) {
                throw new Error(`Error! status: ${db_priview_response.status}`);
            }
            const preview = await db_priview_response.text();
            console.log('db preview is: ', JSON.parse(preview));
            setDBPreview(JSON.parse(preview));
        } catch (err) {
            setErr(err.message);
        }
    }

    const handleDBSelection = async (event) => {
        setTable(event);
        await sendDBPreviewRequest(event);
    }

    const handleKSelection = async (event) => {
        setK(event);
    }

    const optionalDBs = ["csrankings.csv", "nba_2023_2024.csv"];
    const optionalWeightConstraintsType = ["triangle","cube"];
    const optionalBoxVisualizations = ["Bar Chart","2D Rectangles"];
    // const setOptionalDBs = async () => {
    //     await fetch('http://127.0.0.1:8000/datasets', {method: 'GET', headers: {
    //                 Accept: 'application/json',
    //             }}).then(response => response.json().then(data => this.setState({optionalDBs: data})));
    // }
    // setOptionalDBs();

    if (DBPreview.length === 0 && !DBPreviewLoading) {
        setDBPreviewLoading(true);
        sendDBPreviewRequest(table).then(r => setDBPreviewLoading(false));
    }


    const getSelectedFields = () => formFields.map(f => f.field).concat(formConstraints.map(f => f['groups'].map(g => g.field)).flat(1));

    return (
        <div className="QueryRefinement">
            <div className="QueryForm">
                <Container>
                    <h5 className={"instructions"}><b>Welcome to Why-Not-Yet Demo!</b><br/><br/>
                        Please follow the instructions below:<br/>
                        <font color={'#4c0bce'}><b>- - - - - - - - - - - - - - - - - - - - - - - -</b></font></h5><br/>
                    <Row>
                        <Col sm={7}>
                            <Form onSubmit={()=>{}}>
                                <Form.Group as={Row} className="mb3">
                                    <Row>
                                        <Col xs={20}>
                                            <Form.Label htmlFor="Select">1. <u> Select The DB you want to work with</u></Form.Label>
                                        </Col>

                                        <Col xs={8}>
                                            <Select id="db-select" className="db-select"
                                                    defaultValue={table}
                                                    options={optionalDBs.map((o) => {
                                                        return {value: o, label: o}
                                                    })}
                                                    onChange={handleDBSelection}
                                            >
                                            </Select>
                                        </Col>
                                    </Row>
                                </Form.Group>
                                <br/><br/>
                                <Form.Group as={Row} className="mb3">

                                    <Form.Label htmlFor="Select">2. <u>Add weight constraints</u></Form.Label>
                                    <Col xs={20}>
                                        Weight Constraints Type:
                                        <Select id="weight-constraints-type-select"
                                                className="weight-constraints-type-select"
                                                options={optionalWeightConstraintsType.map((o) => {
                                                    return {value: o, label: o}
                                                })}
                                                onChange={setWeightConstraintsType} defaultValue={weightConstraintsType}
                                        >
                                        </Select>
                                        <br/><br/>
                                    </Col>
                                    {userWeightConstraints.map((form, index) => {
                                        return (
                                            <MDBInputGroup key={index} className='mb-3'>
                                                <Button onClick={() => removeUserWeightConstraint(index)}
                                                        className='remove-btn rounded-circle' color="secondery" floating
                                                        tag='a'>
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16"
                                                         fill="currentColor" className="bi bi-trash"
                                                         viewBox="0 0 16 16">
                                                        <path
                                                            d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z"/>
                                                        <path fill-rule="evenodd"
                                                              d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z"/>
                                                    </svg>
                                                </Button>
                                                <input
                                                    className='form-conditions-control'
                                                    name='attribute'
                                                    placeholder='Attribute'
                                                    onChange={event => handleUserWeightConstraintsChange(event, index)}
                                                    value={form.field}
                                                    autoComplete="off"
                                                />
                                                <input
                                                    className='form-conditions-control'
                                                    name='lower_bound'
                                                    placeholder='Lower Bound'
                                                    onChange={event => handleUserWeightConstraintsChange(event, index)}
                                                    value={form.operator}
                                                    autoComplete="off"
                                                />
                                                <input
                                                    className='form-conditions-control'
                                                    name='upper_bound'
                                                    placeholder='Upper Bound'
                                                    onChange={event => handleUserWeightConstraintsChange(event, index)}
                                                    value={form.value}
                                                    autoComplete="off"
                                                />
                                            </MDBInputGroup>
                                        );
                                    })}
                                </Form.Group>
                                <Button className='add-btn rounded-circle' onClick={addUserWeightConstraint} floating tag='a'>
                                    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" fill="currentColor"
                                         className="bi bi-plus-circle-fill" viewBox="0 0 16 16">
                                        <path
                                            d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zM8.5 4.5a.5.5 0 0 0-1 0v3h-3a.5.5 0 0 0 0 1h3v3a.5.5 0 0 0 1 0v-3h3a.5.5 0 0 0 0-1h-3v-3z"/>
                                    </svg>
                                </Button>
                            </Form>
                        </Col>
                        <Row>
                            <Col xs={5}>
                                <br/><Form.Label htmlFor="Select">3. <u>Select K</u></Form.Label>
                            </Col>
                        </Row>
                        <Row>
                        <Col xs={5}>
                                <select onChange={handleKSelection} defaultValue={k}>
                                    {
                                        [...Array(DBPreview.rows !== undefined ? DBPreview.rows.length : 10)].map((_, i) => i + 1)
                                            .map(i => <option key={i} value={i}>{i}</option>)
                                    }
                                </select>
                            </Col>
                        </Row>
                        <Row>
                            <Col>
                                <br/>
                                4. <u>Select a tuple from the data (The selected tuple is: {selectedTuple})</u>
                                <br/><br/>
                            </Col>
                        </Row>
                        <ShowQueryTable
                            containerClassName={"db-preview-dynamic-table"}
                            data={DBPreview}
                            selectedFields={"*"}
                            alwaysShow={true}
                            removedFromOriginal={[]}
                            onClickTuple={onClickSelectedTuple}
                            selectedTuple={selectedTuple}></ShowQueryTable>
                        <Col sm={5}>
                            <div>{Object.keys(query).length !== 0 ?
                                <div><br/><h3>Your requested query</h3> <br/><QueryView
                                    queryDict={query}/><br/><br/>
                                    <ShowQueryTable containerClassName={"requested-query-dynamic-table"}
                                                    data={originalQueryResults}
                                                    selectedFields={getSelectedFields()}
                                                    removedFromOriginal={[]}
                                                    alwaysShow={true}></ShowQueryTable>


                                </div> : ''}</div>
                        </Col>
                    </Row>
                </Container>
                <Container>
                    <br/>
                    <hr/>
                    <br/>
                    <h5 className={"instructions"}>
                        <u>The Why-Not-Yet Results:</u>
                    </h5>
                    <br/>
                    <Row>
                        <div className={"frame"}>
                            1. <u> The SAT Query </u><br/>
                            Does there exist a weight vector W such that t ranks among the top-k for some ranking
                            function?
                            <br/>
                            <p style={{"text-indent": "50px"}}>
                                {satAns !== undefined ?
                                    "Answer: " + (satAns ? "Yes! :)" : "No... :(") :
                                    "Answer: No SAT Query answer received"}
                            </p>
                            <br/>
                        </div>
                        <div className={"frame"}>
                            2. <u> The BEST Query </u><br/>
                            What is the best rank that t can reach for any scoring function?
                            <br/>
                            <p style={{"text-indent": "50px"}}>
                                {bestAns !== undefined ?
                                    "Answer: " + (bestAns === true ? 1 : bestAns) :
                                    "Answer: No BEST Query answer received"}
                            </p>
                            <br/>
                        </div>
                    </Row>
                    <Row>
                        <div className={"frame"}>
                            3. <u> The POINT Query </u><br/>
                            Return a weight vector W such that t ranks among the top-k.
                            <br/>
                            <p style={{"text-indent": "50px"}}>
                                {bestAns !== undefined ?
                                    "Answer: " + pointAns.datasets[0].data :
                                    "Answer: No POINT Query answer received"}
                            </p>
                            {pointAns !== undefined ?
                            <div className={"doughnut"}><Doughnut redraw={true} data={pointAns}/></div> : ''}
                        </div>
                        <br/>
                        <br/>
                    </Row>
                    <Row>
                        <div className={"frame"}>
                            4. <u> The BOX Query </u><br/>
                            Return the inner box B with the largest volume such that t ranks among the top-k.
                            <br/>
                            <p style={{"text-indent": "50px"}}>
                                {boxAns !== undefined ?
                                    "Answer: Bottom left point - " + boxAns.bottom_left.coordinates + ",  Top right point - " + boxAns.top_right.coordinates:
                                    "Answer: No BOX Query answer received"}
                            </p>
                            {boxAns !== undefined ?
                                <div>
                                    {
                                        optionalBoxVisualizations.map(item =>
                                            <div className="radio">
                                                <label>
                                                    <input type="radio" value={item} onClick={(e) => setSelectedBoxVisualization(e.target.value)} checked={selectedBoxVisualization === item}/>
                                                    {item}
                                                </label>
                                            </div>
                                        )
                                    }
                                </div>
                                : ''}
                            {boxAns !== undefined && selectedBoxVisualization === '2D Rectangles' ?
                                <div>
                                    <Col xs={8}>
                                        x:<Select id="box-attr-number-1" className="box-attr-number"
                                                  defaultValue={0}
                                                  options={getNumericAttrs().map((o, i) => {
                                                      return {value: i, label: o}
                                                  })}
                                                  onChange={setBoxAttrNumber1}
                                    >
                                    </Select>
                                        <br/>y:<Select id="box-attr-number-2" className="box-attr-number"
                                                       defaultValue={1}
                                                       options={getNumericAttrs().map((o, i) => {
                                                           return {value: i, label: o}
                                                       })}
                                                       onChange={setBoxAttrNumber2}
                                    ></Select>
                                    </Col>
                                    <Chart id={'hello'}
                                           ref={ref}
                                           redraw={true}
                                           data={{
                                               labels: [...Array(Math.ceil(boxAns.top_right.coordinates[boxAttrNumber1] * 1.1) + 1).keys()],
                                               datasets: [{
                                                   fill: false,
                                                   borderColor: 'rgb(75, 192, 192)',
                                                   tension: 0.1
                                               }]
                                           }}
                                           type={'line'}
                                           options={{
                                               scales: {
                                                   x: {
                                                       title: {
                                                           display: true,
                                                           text: getNumericAttrs()[boxAttrNumber1]
                                                       }
                                                   },
                                                   y: {
                                                       title: {
                                                           display: true,
                                                           text: getNumericAttrs()[boxAttrNumber2]
                                                       },
                                                       max: Math.ceil(boxAns.top_right.coordinates[boxAttrNumber2] * 1.1) + 1
                                                   }
                                               },
                                               plugins: {
                                                   annotation: {
                                                       annotations: {
                                                           box1: {
                                                               type: 'box',
                                                               xMin: boxAns.bottom_left.coordinates[boxAttrNumber1],
                                                               xMax: boxAns.top_right.coordinates[boxAttrNumber1],
                                                               yMin: boxAns.bottom_left.coordinates[boxAttrNumber2],
                                                               yMax: boxAns.top_right.coordinates[boxAttrNumber2],
                                                               backgroundColor: 'rgba(255, 99, 132, 0.25)',
                                                               borderWidth: 1
                                                           }
                                                       }
                                                   }
                                               }
                                           }}/>
                                </div> : ''}
                            {boxAns !== undefined && selectedBoxVisualization === 'Bar Chart' ?
                                <Chart id={'hilo'}
                                           redraw={true}
                                           data={{
                                               labels: getNumericAttrs(),
                                               datasets: [{
                                                   data: Array.from(getNumericAttrs().keys().map((i) => [boxAns.bottom_left.coordinates[i], boxAns.top_right.coordinates[i]])),
                                                   fill: false,
                                                   borderColor: 'rgb(75, 192, 192)',
                                                   tension: 0.1
                                               }]
                                           }}
                                           type={'bar'}
                                           options={{
                                               scales: {
                                                   y: {
                                                       max: Math.ceil(Math.max(boxAns.top_right.coordinates))
                                                   }
                                               }
                                           }}/> : ''
                            }
                        </div>
                    </Row>
                </Container>

                <br/>
                <br/>
                <div>{err !== '' ? "Error: " + err : ''}</div>
                <br/>
            </div>
        </div>
    )
        ;
}

export default QueryForm;
