import "bootstrap/dist/css/bootstrap.min.css";
import React from 'react';
import { render } from 'react-snapshot';
import "./index.css";
import App from "./App";




render(<App />, document.querySelector('#root'));
