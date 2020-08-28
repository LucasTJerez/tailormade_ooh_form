import React from "react";
import { makeStyles } from '@material-ui/core/styles';
import { Typography, Toolbar, Paper } from '@material-ui/core';

import CalculateReach from "./pages/CalculateReach";

const useStyles = makeStyles((theme) => ({
    root: {
        flexGrow: 1,
        backgroundColor: '#757ce8',
    },
    paper: {
        marginLeft: theme.spacing(8),
        marginRight: theme.spacing(8),
    },
    calculateReach: {
        padding: theme.spacing(4),
    },
}));



export default function App() {
    const classes = useStyles();
    return (
        <div className={classes.root} >


            <Paper className={classes.paper}>

                    <Toolbar>
                        <Typography color="textSecondary" className={classes.title} variant="h4" noWrap>
                            Out-of-Home Reach Request Form
          </Typography>
                    </Toolbar>
                <div className={classes.calculateReach}>
                    <CalculateReach />
                </div>
            </Paper>
        </div>
    );
}


