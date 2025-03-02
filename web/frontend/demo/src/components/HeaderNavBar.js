import React from 'react';
import Container from 'react-bootstrap/Container';
import Nav from 'react-bootstrap/Nav';
import Navbar from 'react-bootstrap/Navbar';
import NavDropdown from 'react-bootstrap/NavDropdown';
import "./HeaderNavBar.css";
import logo from '../erica.png'

function HeaderNavBar() {
  return (
    <Navbar collapseOnSelect className="navbar-color" expand="lg" variant="dark">
      <Container>
        <Navbar.Brand href="/queries">  <img src={logo} style={{height: '30px'}} alt="Logo" />
</Navbar.Brand>
        <Navbar.Toggle aria-controls="responsive-navbar-nav" />
        <Navbar.Collapse id="responsive-navbar-nav">
          <Nav className="me-auto">
            <Nav.Link href="/queries">Set Query</Nav.Link>
            <Nav.Link href="/advanced">Why Not Yet Answers</Nav.Link>
            <NavDropdown title="Dropdown" id="collasible-nav-dropdown" hidden={true}>
              <NavDropdown.Item href="#action/3.1">Action</NavDropdown.Item>
              <NavDropdown.Item href="#action/3.2">
                Another action
              </NavDropdown.Item>
              <NavDropdown.Item href="#action/3.3">Something</NavDropdown.Item>
              <NavDropdown.Divider />
              <NavDropdown.Item href="#action/3.4">
                Separated link
              </NavDropdown.Item>
            </NavDropdown>
          </Nav>
          <Nav>
            <Nav.Link href="/Instructions">Instructions</Nav.Link>
            <Nav.Link href="/aboutUs">About Us</Nav.Link>
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
}

export default HeaderNavBar;