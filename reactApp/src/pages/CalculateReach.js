
import React, { Component } from "react";
import { Autocomplete, Alert, AlertTitle } from '@material-ui/lab';
import { DateRangePicker } from 'react-dates';
import moment from 'moment';
import { withStyles } from "@material-ui/core/styles";
import { isInclusivelyBeforeDay } from 'react-dates';
import {
    Collapse,
    FormControl,
    FormHelperText,
    Grid,
    TextField,
    Checkbox,
    Chip,
    FormControlLabel,
    FormGroup,
    FormLabel,
    Button,
    Divider,
} from '@material-ui/core';
import 'react-dates/initialize';
import 'react-dates/lib/css/_datepicker.css';

//used to get market segments from audience api
const axios = require('axios').default;

//styles for subcomponents
const styles = theme => ({
    root: { flexGrow: 1, },
    divider: {
        marginTop: theme.spacing(2.5),
        marginBottom: theme.spacing(2.5),
    },
    buttons: { margin: "auto", },
    alert: { marginBottom: theme.spacing(2.5) }

})


class CalculateReach extends Component {

    state = {
        reachData: { //data to upload
            reachName: "",
            segments: [],
            genders: [],
            ages: [],
            locations: [],
            mediums: [],
            start: null,
            end: null,
            backtrackStart: null,
            backtrackEnd: null,
            comments: "",
        },
        formData: { //helperData for the form
            sampleReach: {},
            names: {},
            helperTexts: {},
            segments: [],
            locations: [],
            focusedInput: null,
            backtrackFocusedInput: null,
        },
        validations: { //field validation and helper texts
            formHasError: false,
            fieldHasError: {
                reachName: false,
                locations: false,
                date: false,
                mediums: false,
                ages: false,
                segments: false,
                genders: false,
            },
            helperTexts: {
                reachName: "",
                locations: "",
                date: "",
                mediums: "",
                ages: "",
                segments: "",
                comments: "",
                genders: "",
                backtrack: "",
            },
        },
    }

    constructor(props) { // instantiates state: formData and validations. formData.segments data uploaded in componentDidMount
        super(props);
        const {
            formData,
            validations
        } = this.state;

        let formDataRaw = require('./formData.json');
        let formDataNew = formData;
        for (var key in formDataRaw) { // does not instantiate formdata.segments
            formDataNew[key] = formDataRaw[key]
        };

        //instantiate helperTexts
        let validationsNew = validations;
        validationsNew.helperTexts = formDataNew.helperTexts.valid;

        this.state = { ...this.state, formData: formDataNew, validations: validationsNew, };
    }





    componentDidMount() { //uploads sample reach ato local storage nd instantiates formdata.segments
        const { formData } = this.state;

        //making sure there are items in local storage, if not, upload an example
        if (localStorage.getItem("calculatedReaches") === null) {
            let calculatedReaches = {
                [formData.sampleReach.reachName]: formData.sampleReach,
            };
            localStorage.setItem('calculatedReaches', JSON.stringify(calculatedReaches));
        };

        //request segments from api
        const audience_api = axios.create({
            baseURL: 'https://dev-di-audience-api.apps-dev.tid.es/rest/v1',
            timeout: 20000,
            withCredentials: true,
            responseType: 'json',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer dG1hZHNAdG1hZHM6dWlHekRFd0FoZ0FndGdXWWN0eEFSY21iR2U5RHNIODF6SUZudEUyR0g5czNLNHFIc1V5bHhnVnRraHVCTDVVOVZwRGM3WXBOaFlvSVpLNUc3V2E3T3c'
            }
        });


        let segmentsNew = [];
        let locationsNew = [];
        let segmentsRaw = audience_api.get("enum/segments/items")
        let locationsRaw = audience_api.get("enum/provinces/items")
        axios.all([locationsRaw, segmentsRaw]).then(axios.spread((...responses) => {
            responses[0].data.enumItems.items.map((value) => {
                locationsNew.push(value.displayValue)
            })
            responses[1].data.enumItems.items.map((value) => {
                segmentsNew.push(value.value)
            })
        })).catch(errors => {
            alert(errors)
        })
        this.setState({ formData: { ...formData, segments: segmentsNew, locations: locationsNew } });
    }

    getFieldErrors() { //returns string of fields with errors for error alert
        const { fieldHasError } = this.state.validations;
        let stringToReturn = "";
        Object.keys(fieldHasError).forEach((key) => {
            if (fieldHasError[key]) {
                key === "reachName" ?
                    stringToReturn += "reach name, "
                    :
                    stringToReturn += key + ", ";
            };
        });
        return stringToReturn.slice(0, stringToReturn.length - 2);
    }

    setValidation(validationsNew, field, index) { //index = -1 means field is valid, index = 0-2 indicates different errors
        const helperTexts = this.state.formData.helperTexts;
        let helperTextToSet = "";
        let fieldHasErrorToSet = (index !== -1);

        fieldHasErrorToSet ? helperTextToSet = helperTexts.error[field][index] : helperTextToSet = helperTexts.valid[field];

        validationsNew = {
            ...validationsNew,
            fieldHasError: {
                ...validationsNew.fieldHasError,
                [field]: fieldHasErrorToSet,
            },
            helperTexts: {
                ...validationsNew.helperTexts,
                [field]: helperTextToSet,
            }
        };
        return validationsNew;
    }

    validateList(validationsNew) { // check if lists in reachData are empty
        let reachDataLists = this.state.reachData;

        Object.keys(reachDataLists).forEach((key) => {
            if (Array.isArray(reachDataLists[key])) {
                if (reachDataLists[key].length === 0) {
                    validationsNew = this.setValidation(validationsNew, key, 0);
                }
                else {
                    validationsNew = this.setValidation(validationsNew, key, -1);
                };
            };
        });
        return validationsNew;
    }

    validateFails(input) {
        const {
            reachData,
            validations,
        } = this.state;
        const {
            reachName,
            start,
            end,
        } = reachData;
        let validationsNew = validations;


        //validate reachName
        if (reachName.length < 4) {
            validationsNew = this.setValidation(validationsNew, "reachName", 0);
        }
        else if (reachName.includes(" ")) {
            validationsNew = this.setValidation(validationsNew, "reachName", 1);
        }
        else {
            validationsNew = this.setValidation(validationsNew, "reachName", -1);
        };

        //validate duration
        if (start === null || end === null) {
            validationsNew = this.setValidation(validationsNew, "date", 1);
        };

        //validate reachData lists (segments, genders, ages, locations, mediums)
        validationsNew = this.validateList(validationsNew);

        let hasError = validationsNew.formHasError = Object.values(validationsNew.fieldHasError).includes(true);
        if (hasError) { window.scrollTo(0, 0) };


        this.setState({ validations: validationsNew });
    }

    handleChange(event) {
        let fieldName = event.target.name;
        let fieldVal = event.target.value;
        let reachDataNew = this.state.reachData;

        reachDataNew[fieldName] = fieldVal;
        this.setState({ reachData: reachDataNew });
    }

    handleSelectChange(event) {
        let fieldName = event.target.name;
        let fieldVal = event.target.value;
        let reachDataNew = this.state.reachData;
        let listCopy = reachDataNew[fieldName];

        if (listCopy.indexOf(fieldVal) === -1) {
            listCopy.push(fieldVal);
        }
        else {
            listCopy.splice(listCopy.indexOf(fieldVal), 1);
        };

        reachDataNew[fieldName] = listCopy;

        this.setState({ reachData: reachDataNew });
    }

    handleDuration = (chosenDate) => {
        const {
            reachData,
            validations,
        } = this.state;
        let {
            startDate,
            endDate
        } = chosenDate;
        let validationsNew = validations;

        if (startDate && endDate && (endDate.diff(startDate, 'days') > 15)) {
            validationsNew = this.setValidation(validationsNew, "date", 0);
            endDate = null;
        }
        else {
            validationsNew = this.setValidation(validationsNew, "date", -1);
        };
        this.setState({ reachData: { ...reachData, start: startDate, end: endDate }, validations: validationsNew });
    }

    handleBacktrack = (chosenDate) => {
        const {
            reachData,
        } = this.state;
        let {
            startDate,
            endDate
        } = chosenDate;
        this.setState({ reachData: { ...reachData, backtrackStart: startDate, backtrackEnd: endDate } });
    }


    uploadFormula() {

        this.validateFails();

        if (!this.state.validations.formHasError) {
            const uploadedReaches = JSON.parse(localStorage.getItem('calculatedReaches'));
            const reachDataToUpload = this.state.reachData;

            var today = new Date();
            var dd = String(today.getDate()).padStart(2, '0');
            var mm = String(today.getMonth() + 1).padStart(2, '0');
            var yyyy = today.getFullYear();
            today = mm + '/' + dd + '/' + yyyy;
            reachDataToUpload.dateCreated = today
            
            uploadedReaches[reachDataToUpload.reachName] = reachDataToUpload;
            localStorage.setItem('calculatedReaches', JSON.stringify(uploadedReaches));
        };
    }



    render() {
        const { classes } = this.props;
        const {
            reachData,
            validations,
            formData,
        } = this.state;
        const {
            mediums,
            start,
            end,
            backtrackStart,
            backtrackEnd,
            ages,
            genders,
        } = reachData;
        const {
            fieldHasError,
            helperTexts,
        } = validations;

        return (
            <Grid
                container
                direction="column"
                spacing={3}
            >
                <Grid item xs={12}>
                    <Collapse in={this.state.validations.formHasError}>
                        <Alert className={classes.alert} severity="error">
                            <AlertTitle >Error</AlertTitle>
                            Fields:
                            <strong>
                                {" " + this.getFieldErrors()}
                            </strong>
                        </Alert>
                    </Collapse>

                    {/* reachName name */}
                    <FormControl error={fieldHasError.reachName}>
                        <FormLabel>Reach Name</FormLabel>
                        <FormGroup row >
                            <TextField

                                variant="outlined"
                                name={"reachName"}
                                onChange={this.handleChange.bind(this)}
                                error={fieldHasError.reachName}
                            />
                        </FormGroup>
                        <FormHelperText >{helperTexts.reachName}</FormHelperText>
                    </FormControl>

                    <Divider className={classes.divider} />

                    {/* segments */}
                    <Autocomplete
                        multiple
                        id="tags-filled"
                        options={formData.segments}
                        value={reachData.segments}
                        onChange={(event, selected) => {
                            this.setState({
                                reachData: {
                                    ...reachData,
                                    segments: selected
                                }
                            })
                        }}
                        renderTags={(value, getTagProps) =>
                            value.map((option, index) => (
                                <Chip label={option} {...getTagProps({ index })} />
                            ))
                        }
                        renderInput={(params) => (
                            <FormControl error={fieldHasError.segments}>
                                <FormLabel>Segments</FormLabel>
                                <TextField error={fieldHasError.segments} {...params} variant="outlined" placeholder="Search here" />
                                <FormHelperText >{helperTexts.segments}</FormHelperText>
                            </FormControl>
                        )}
                    />

                    <Divider className={classes.divider} />

                    {/* locations */}
                    <Autocomplete
                        multiple
                        id="tags-filled"
                        options={formData.locations}
                        // freeSolo //allows any input
                        value={reachData.locations}
                        onChange={(event, selected) => {
                            this.setState({
                                reachData: {
                                    ...reachData,
                                    locations: selected
                                }
                            })
                        }}
                        renderTags={(value, getTagProps) =>
                            value.map((option, index) => (
                                <Chip label={option} {...getTagProps({ index })} />
                            ))
                        }
                        renderInput={(params) => (
                            <FormControl error={fieldHasError.locations}>
                                <FormLabel>Locations</FormLabel>
                                <TextField error={fieldHasError.locations} {...params} variant="outlined" placeholder="Search here" />
                                <FormHelperText >{helperTexts.locations}</FormHelperText>
                            </FormControl>
                        )}
                    />

                    <Divider className={classes.divider} />

                    {/* genders */}
                    <FormControl error={fieldHasError.genders}>
                        <FormLabel>Genders</FormLabel>
                        <FormGroup row>
                            {formData.names.genderNames.map((name) => (
                                <FormControlLabel
                                    key={name}
                                    control={
                                        <Checkbox
                                            color="primary"
                                            checked={genders.indexOf(name) > -1}
                                            name={"genders"}
                                            value={name}
                                            onChange={this.handleSelectChange.bind(this)}
                                        />
                                    }
                                    label={name}
                                />
                            ))}
                        </FormGroup>
                        <FormHelperText>{helperTexts.genders}</FormHelperText>
                    </FormControl>

                    <Divider light className={classes.divider} />

                    {/* age */}
                    <FormControl error={fieldHasError.ages}>
                        <FormLabel>Ages</FormLabel>
                        <FormGroup row>
                            {formData.names.ageNames.map((name) => (
                                <FormControlLabel
                                    key={name}
                                    control={
                                        <Checkbox
                                            name={"ages"}
                                            value={name}
                                            onChange={this.handleSelectChange.bind(this)}
                                            color="primary"
                                            checked={ages.indexOf(name) > -1}
                                        />
                                    }
                                    label={name}
                                />
                            ))}
                        </FormGroup>
                        <FormHelperText>{helperTexts.ages}</FormHelperText>
                    </FormControl>

                    <Divider className={classes.divider} />

                    {/* medium */}
                    <FormControl error={fieldHasError.mediums}>
                        <FormLabel>Mediums</FormLabel>
                        <FormGroup row>
                            {formData.names.mediumNames.map((name) => (
                                <FormControlLabel
                                    key={name}
                                    control={
                                        <Checkbox
                                            color="primary"
                                            checked={mediums.indexOf(name) > -1}
                                            name={"mediums"}
                                            value={name}
                                            onChange={this.handleSelectChange.bind(this)}
                                        />
                                    }
                                    label={name}
                                />
                            ))}

                        </FormGroup>
                        <FormHelperText>{helperTexts.mediums}</FormHelperText>
                    </FormControl>

                    <Divider light className={classes.divider} />

                    {/* DATE RANGE PICKER */}
                    <FormControl error={fieldHasError.date}>
                        <FormLabel>Duration</FormLabel>
                        <FormGroup row>
                            <DateRangePicker
                                startDateId="durationStart"
                                endDateId="durationEnd"
                                firstDayOfWeek={1}
                                startDate={start}
                                endDate={end}
                                displayFormat="DD-MM-YYYY"
                                focusedInput={formData.focusedInput}
                                onFocusChange={focusedInput =>
                                    this.setState({ formData: { ...formData, focusedInput } })
                                }
                                onDatesChange={this.handleDuration}
                                startDatePlaceholderText=" Start date"
                                endDatePlaceholderText=" End date"
                            />
                        </FormGroup>
                        <FormHelperText>{helperTexts.date}</FormHelperText>
                    </FormControl>

                    <Divider className={classes.divider} />

                    {/* backtrack */}
                    <FormControl error={validations.backtrack}>
                        <FormLabel>Backtrack Data</FormLabel>
                        <FormGroup row>
                            <DateRangePicker
                                startDateId="backtrackStart"
                                endDateId="backtrackEnd"
                                isOutsideRange={day => !isInclusivelyBeforeDay(day, moment())}
                                firstDayOfWeek={1}
                                startDate={backtrackStart}
                                endDate={backtrackEnd}
                                displayFormat="DD-MM-YYYY"
                                focusedInput={formData.backtrackFocusedInput}
                                onFocusChange={backtrackFocusedInput =>
                                    this.setState({ formData: { ...formData, backtrackFocusedInput } })
                                }
                                onDatesChange={this.handleBacktrack}
                                startDatePlaceholderText=" Start date"
                                endDatePlaceholderText=" End date"
                            />
                        </FormGroup>
                        <FormHelperText>*optional: use data from a period of time</FormHelperText>
                    </FormControl>

                    <Divider className={classes.divider} />


                    {/* comments */}
                    <FormControl >
                        <FormGroup component="legend">
                            <FormLabel >Comments</FormLabel>
                            <TextField
                                name={"comments"}
                                onChange={this.handleChange.bind(this)}
                                color="primary"
                                multiline
                                variant="outlined"
                            />

                        </FormGroup>
                        <FormHelperText>{helperTexts.comments}</FormHelperText>
                    </FormControl>
                </Grid >

                <Button
                    className={classes.buttons}
                    onClick={() => this.uploadFormula()}
                    variant="contained"
                    size="large"
                    color="primary"
                >
                    Submit
                    </Button>
            </Grid >
        );
    }
}



export default withStyles(styles, { withTheme: true })(CalculateReach);