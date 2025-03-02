import './QueryForm.css';
import Form from 'react-bootstrap/Form';




import React, {useState} from 'react';
import ShowQueryTable from "./ShowQueryTable";
import {ButtonGroup, Col, Row} from "react-bootstrap";
import {Select} from "antd";
import Container from "react-bootstrap/Container";
import QueryView from "./QueryView";


import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend);

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


    const handleFieldsFormChange = (event, index) => {
        let data = [...formFields];
        console.log(event);
        data[index][event.target.name] = event.target.value;
        setFormFields(data);
    }

    const sendSatRequest = async () => {
        await fetch('http://127.0.0.1:8000/explain/sat', {
                method: 'POST',
                body: JSON.stringify(
                    {
                      "dataset": table,
                      "tuple_id": selectedTuple,
                      "k": k,
                      "weight_constraints": "box",
                      "user_weight_constraints": [
                        {
                          "attribute": "string",
                          "lower_bound": 0,
                          "upper_bound": 0
                        }
                      ]
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
    const sendBestRequest = async () => {
        await fetch('http://127.0.0.1:8000/explain/best', {
                method: 'POST',
                body: JSON.stringify(
                    {
                      "dataset": table,
                      "tuple_id": selectedTuple,
                      "k": k,
                      "weight_constraints": "box",
                      "user_weight_constraints": [
                        {
                          "attribute": "string",
                          "lower_bound": 0,
                          "upper_bound": 0
                        }
                      ]
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

    const sendPointRequest = async () => {
        await fetch('http://127.0.0.1:8000/explain/point', {
                method: 'POST',
                body: JSON.stringify(
                    {
                      "dataset": table,
                      "tuple_id": selectedTuple,
                      "k": k,
                      "weight_constraints": "box",
                      "user_weight_constraints": [
                        {
                          "attribute": "string",
                          "lower_bound": 0,
                          "upper_bound": 0
                        }
                      ]
                    }
                ),
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                }}).then(response => response.json())
                    .then(response => {
                        const config = doughnutConfig;
                        config.labels = DBPreview.attributes.filter(attr => attr.numeric).map(attr => attr.name);
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

    const sendBoxRequest = async () => {
        await fetch('http://127.0.0.1:8000/explain/box', {
                method: 'POST',
                body: JSON.stringify(
                    {
                      "dataset": table,
                      "tuple_id": selectedTuple,
                      "k": k,
                      "weight_constraints": "box",
                      "user_weight_constraints": [
                        {
                          "attribute": "string",
                          "lower_bound": 0,
                          "upper_bound": 0
                        }
                      ]
                    }
                ),
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                }}).then(response => response.json())
                    .then(response => {
                        // setBestAns(response);
                        // console.log(response)
        })};


    const sendRequests = async () => {
        await sendSatRequest();
        if(satAns !== false){
            await sendPointRequest();
        }
        await sendBestRequest();
        await sendBoxRequest();
    }

    const onClickSelectedTuple = async (i) => {
        setSelectedTuple(i);
        await sendRequests();
    }

    const setDefault = () => {
        let fields = [
            {field: 'grade1', operator: '>=', value: '13'},
            {field: 'grade2', operator: '>=', value: '13'},
            {field: 'age', operator: 'IN', value: '["15-16","17-18"]'},
            {field: 'higherEdIntention', operator: 'IN', value: '["yes"]'},
        ]
        setFormFields(fields);
    }


    const reset = () => {

        setFormFields([])
    }

    const addFields = () => {
        let object = {
            field: '',
            operator: '',
            value: ''
        }
        setFormFields([...formFields, object])
    }

    const removeFields = (index) => {
        let data = [...formFields];
        data.splice(index, 1)
        setFormFields(data)
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

    const optionalDBs = ["csrankings.csv", "nba_2023_2024.csv"];
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
                    <h5>Please follow the instructions:</h5>
                    <Row>
                        <Col sm={7}>
                            <Form onSubmit={()=>{}}>
                                <Form.Group as={Row} className="mb3">
                                    <Row>
                                        <Col xs={20}>
                                            <Form.Label htmlFor="Select">1. Select The DB you want to work with</Form.Label>
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
                                {/*<Form.Group as={Row} className="mb3">*/}
                                {/*    <Form.Label htmlFor="Select">2. Add selection conditions</Form.Label>*/}
                                {/*    {formFields.map((form, index) => {*/}
                                {/*        return (*/}
                                {/*            <MDBInputGroup key={index} className='mb-3'>*/}
                                {/*                <Button onClick={() => removeFields(index)}*/}
                                {/*                        className='remove-btn rounded-circle' color="secondery" floating*/}
                                {/*                        tag='a'>*/}
                                {/*                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16"*/}
                                {/*                         fill="currentColor" className="bi bi-trash"*/}
                                {/*                         viewBox="0 0 16 16">*/}
                                {/*                        <path*/}
                                {/*                            d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z"/>*/}
                                {/*                        <path fill-rule="evenodd"*/}
                                {/*                              d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z"/>*/}
                                {/*                    </svg>*/}
                                {/*                </Button>*/}
                                {/*                <input*/}
                                {/*                    className='form-conditions-control'*/}
                                {/*                    name='field'*/}
                                {/*                    placeholder='Field'*/}
                                {/*                    onChange={event => handleFieldsFormChange(event, index)}*/}
                                {/*                    value={form.field}*/}
                                {/*                    autoComplete="off"*/}
                                {/*                />*/}
                                {/*                <input*/}
                                {/*                    className='form-conditions-control-very-short'*/}
                                {/*                    name='operator'*/}
                                {/*                    placeholder='op'*/}
                                {/*                    onChange={event => handleFieldsFormChange(event, index)}*/}
                                {/*                    value={form.operator}*/}
                                {/*                    autoComplete="off"*/}
                                {/*                />*/}
                                {/*                <input*/}
                                {/*                    className='form-conditions-control'*/}
                                {/*                    name='value'*/}
                                {/*                    placeholder='value'*/}
                                {/*                    onChange={event => handleFieldsFormChange(event, index)}*/}
                                {/*                    value={form.value}*/}
                                {/*                    autoComplete="off"*/}
                                {/*                />*/}
                                {/*            </MDBInputGroup>*/}
                                {/*        );*/}
                                {/*    })}*/}
                                {/*</Form.Group>*/}
                                {/*<Button className='add-btn rounded-circle' onClick={addFields} floating tag='a'>*/}
                                {/*    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" fill="currentColor"*/}
                                {/*         className="bi bi-plus-circle-fill" viewBox="0 0 16 16">*/}
                                {/*        <path*/}
                                {/*            d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zM8.5 4.5a.5.5 0 0 0-1 0v3h-3a.5.5 0 0 0 0 1h3v3a.5.5 0 0 0 1 0v-3h3a.5.5 0 0 0 0-1h-3v-3z"/>*/}
                                {/*    </svg>*/}
                                {/*</Button>*/}


                                {/*<ButtonGroup className="me-2">*/}
                                {/*    <Button className='set-default-btn rounded-circle' onClick={setDefault} tag='a'>*/}
                                {/*        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16"*/}
                                {/*             fill="currentColor"*/}
                                {/*             className="bi bi-shuffle" viewBox="0 0 16 16">*/}
                                {/*            <path fill-rule="evenodd"*/}
                                {/*                  d="M0 3.5A.5.5 0 0 1 .5 3H1c2.202 0 3.827 1.24 4.874 2.418.49.552.865 1.102 1.126 1.532.26-.43.636-.98 1.126-1.532C9.173 4.24 10.798 3 13 3v1c-1.798 0-3.173 1.01-4.126 2.082A9.624 9.624 0 0 0 7.556 8a9.624 9.624 0 0 0 1.317 1.918C9.828 10.99 11.204 12 13 12v1c-2.202 0-3.827-1.24-4.874-2.418A10.595 10.595 0 0 1 7 9.05c-.26.43-.636.98-1.126 1.532C4.827 11.76 3.202 13 1 13H.5a.5.5 0 0 1 0-1H1c1.798 0 3.173-1.01 4.126-2.082A9.624 9.624 0 0 0 6.444 8a9.624 9.624 0 0 0-1.317-1.918C4.172 5.01 2.796 4 1 4H.5a.5.5 0 0 1-.5-.5z"/>*/}
                                {/*            <path*/}
                                {/*                d="M13 5.466V1.534a.25.25 0 0 1 .41-.192l2.36 1.966c.12.1.12.284 0 .384l-2.36 1.966a.25.25 0 0 1-.41-.192zm0 9v-3.932a.25.25 0 0 1 .41-.192l2.36 1.966c.12.1.12.284 0 .384l-2.36 1.966a.25.25 0 0 1-.41-.192z"/>*/}
                                {/*        </svg>*/}
                                {/*    </Button>*/}
                                {/*    <Button className='remove-btn rounded-circle' onClick={reset} tag='a'>*/}
                                {/*        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16"*/}
                                {/*             fill="currentColor" className="bi bi-trash" viewBox="0 0 16 16">*/}
                                {/*            <path*/}
                                {/*                d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z"/>*/}
                                {/*            <path fill-rule="evenodd"*/}
                                {/*                  d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z"/>*/}
                                {/*        </svg>*/}
                                {/*    </Button>*/}
                                {/*    <Button className='submit-btn rounded-circle' onClick={()=>{}} tag='a'>*/}
                                {/*        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20"*/}
                                {/*             fill="currentColor"*/}
                                {/*             className="bi bi-send-fill" viewBox="0 0 16 16">*/}
                                {/*            <path*/}
                                {/*                d="M15.964.686a.5.5 0 0 0-.65-.65L.767 5.855H.766l-.452.18a.5.5 0 0 0-.082.887l.41.26.001.002 4.995 3.178 3.178 4.995.002.002.26.41a.5.5 0 0 0 .886-.083l6-15Zm-1.833 1.89L6.637 10.07l-.215-.338a.5.5 0 0 0-.154-.154l-.338-.215 7.494-7.494 1.178-.471-.47 1.178Z"/>*/}
                                {/*        </svg>*/}
                                {/*    </Button>*/}
                                {/*</ButtonGroup>*/}
                            </Form>
                        </Col>
                        <Row>
                            <br/><br/>
                            <Col xs={5}>
                                <Form.Label htmlFor="Select">3. Select K</Form.Label>
                            </Col>
                        </Row>
                        <Row>
                        <Col xs={5}>
                                <select onChange={setK}>
                                    {
                                        [...Array(DBPreview.rows != undefined ? DBPreview.rows.length : 10)].map((_, i) => i + 1)
                                            .map(i => <option key={i} value={i}>{i}</option>)
                                    }
                                </select>
                            </Col>
                        </Row>
                        <Row>
                            <Col>
                                <br/>
                                4. Select a tuple from the data (The selected tuple is: {selectedTuple})
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
                    <Row>
                        {satAns !== undefined ? "SAT ANSWER: " + (satAns ? "True" : "False") : "No SAT Answer received"}
                        <br/>
                        {bestAns !== undefined ? "BEST ANSWER: " + bestAns : "No BEST Answer received"}
                        <br/>
                    </Row>
                    <Row>
                        <br/>
                        {pointAns !== undefined ? "POINT ANSWER: " + pointAns.datasets[0].data : "No POINT Answer received"}
                        {pointAns !== undefined ? <div className={"doughnut"}> <Doughnut data={pointAns} /></div>: ''}

                        <br/>
                    </Row>
                    <Row>
                        {boxAns !== undefined ? "BOX ANSWER: " + boxAns : "No BOX Answer received"}
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
