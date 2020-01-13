import * as React from "react";
import Sidebar from "./Components/Sidebar";
import Step1 from "./Steps/Step1";
import Step2 from "./Steps/Step2";
import Step3 from "./Steps/Step3";
import Step4 from "./Steps/Step4";
import Step5 from "./Steps/Step5";
import Step6 from "./Steps/Step6";
import Step7 from "./Steps/Step7";
import { CartContext } from "../../components/CartProvider/context";
import BottomNav from "./Components/BottomNav";
import QueryString from "query-string"

const getCurrentDate = ( deap = false) => {
    const value = new Date();
    if (deap ){
        value.setDate(value.getDate() + 3);
    }
    const year = value.getFullYear();
    let month = value.getMonth()+1;
    let dt = value.getDate();
    if (dt < 10) {
        dt = '0' + dt;
    }
    if (month < 10) {
        month = '0' + month;
    }
    return `${dt}-${month}-${year}`;
}
function toStepByQuery( step ){
    switch( step ){
        case "trip-information" : return 1;
        case "upperwear" : return 2;
        case "lowerwear" : return 3;
        case "underwear" : return 4;
        case "socks" : return 5;
        case "accesories" : return 6;
        case "overview" : return 7;
    }
    return 1;
}
class Start extends React.Component {
    constructor( props ){
        super( props );
        this.state = {
            data:{
                step1:{
                    destination: "Lima, Peru",
                    arrival: getCurrentDate(),
                    departure: getCurrentDate(true),
                },
                step2:{ items:[] },
                step3:{ items:[] },
                step4:{ items:[] },
                step5:{ items:[] },
                step6:{ items:[] },
            },
            changes: 1,
            step: 1,
            open:false,
        }
        this.setData = this.setData.bind( this );
        this.openSidebar= this.openSidebar.bind( this);
        this.toCheckout = this.toCheckout.bind( this);
    }
    componentDidMount(){
        //this.props.history.push("/start?step=trip-information")
        const parsed = QueryString.parse(this.props.location.search);
        if ( parsed && parsed.step ){
            this.setState({
                step: toStepByQuery( parsed.step )
            })   
        }
    }
    openSidebar(){ 
        this.setState(prevState => ({
            open: !prevState.open
        }))
    }
    toCheckout(){
        this.setState({
            step: 7
        }, () => this.openSidebar())
    }
    setData( newdata ){
        const { data, changes, open } = this.state;
        this.setState( {
            data: { ...data, ...newdata },
        }, this.forceUpdate() )
    }
    renderStep( cart ) {
        let StepElement = null;
        switch( this.state.step ){
            case 1:
                StepElement = Step1;break;
            case 2: 
                StepElement = Step2;break;
            case 3: 
                StepElement = Step3;break;
            case 4: 
                StepElement = Step4;break;
            case 5: 
                StepElement = Step5;break;
            case 6: 
                StepElement = Step6;break;
            case 7: 
                StepElement = Step7;break;
            default: 
                StepElement = Step1;
        }
        return ( <StepElement
            { ...this.props }
            goTo={ (step) => this.goTo(step) }
            data={ this.state.data }
            setData={ this.setData }
            cart={cart}
            /> 
            )
    }
    goTo( step, url = "trip-information" ){
        this.props.history.push(`/start?step=${url}`)
        if( step === 7){
            this.setState({
                open:false,
            })
        }
        this.setState({
            step,
        })
    }
    render() {
        const { data, open, step } = this.state;
        return (
            <div className="start-page">
                <CartContext.Consumer>
                {cart => (
                    <>
                    {
                        this.renderStep(cart)
                    }
                    <div className="start-page-steps">
                        <BottomNav goTo={ (step, url) => this.goTo(step, url) } step={ step } cart={cart} />
                    </div>
                    <div className={ open ? "start-page-sidebar open-s" : "start-page-sidebar close-s" } >
                        <div
                            onClick={ this.openSidebar }
                            className="start-page-sidebar__button">
                            <div className={ !open ? "left-arrow" : "right-arrow"  }/>
                        </div>
                        <div className="start-page-sidebar__container">
                            <Sidebar data={ data } setData={ this.setData }
                            toCheckout={ this.toCheckout }
                            cart={cart}
                            />
                        </div>
                    </div>
                    </>)}
                </CartContext.Consumer>
            </div>
        )
    }
}
export default Start;