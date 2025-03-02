import React from 'react';
import "./DynamicTable.css";

function DynamicTable(props) {
    console.log(props.data.rows);

// get table column
    const attributes = props.data.attributes.map(attr => attr['name']);
    console.log(attributes);
    // get table heading data
    const ThData = () => {
        return (attributes.includes('id') ? [<th key={'id'}>id</th>] : [<th key={'id'}>id</th>]).concat(
            attributes.map((attr, index) => {
                return <th key={attr}>{attr}</th>
            }))
    }

// get table row data
    const tdData = () => {


        return [...Array(props.data.rows.length).keys()].map((i) => {
            return (
                <tr onClick={() => props.onClickTuple(i)} className={props.selectedTuple === i ? "active-row": "non-active-row"}>
                    {
                        (attributes.includes('id') ? [<td>{props.data.rows[i][attributes.indexOf('id')]}</td>] : [<td>{i}</td>]).concat(
                            props.data.rows[i].map(v => <td>{v}</td>)
                        )
                    }
                </tr>
            )
        })
    }


    return (
        <div className={props.className}>
            <table className="query-table">
                <thead>
                <tr>{ThData()}</tr>
                </thead>
                <tbody>
                {tdData()}
                </tbody>
            </table>
        </div>
    )
}

export default DynamicTable;