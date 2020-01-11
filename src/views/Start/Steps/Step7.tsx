import * as React from "react";
import "../styles/styles.scss";
import { History } from "history";
import { CulqiProvider, Culqi } from "react-culqi";
import { AlertManager, useAlert } from "react-alert";
import Modal from "../../../components/Modal";
import ShippingAdressForm from "../../../components/ShippingAddressForm";
import LoginForm from "../../../components/LoginForm";
import { useUserDetails } from "@sdk/react";
import { TypedCreateCheckoutMutation } from "../../../checkout/queries";
import { maybe } from "../../../core/utils";
import { CheckoutContext } from "../../../checkout/context";
import { CartContext } from "../../../components/CartProvider/context";
import { CountryCode } from "types/globalTypes";
import { CartSummary } from "../Components/cart/index";

import { TypedUpdateCheckoutShippingOptionsMutation } from "../../../checkout/views/ShippingOptions/queries";
import { TypedPaymentMethodCreateMutation } from "../../../checkout/views/Payment/queries";
import { TypedCompleteCheckoutMutation } from "../../../checkout/views/Review/queries";
import { completeCheckout } from "../../../checkout/views/Review/types/completeCheckout";
import moment from "moment";

function proceedToBilling(data, update, token) {
  const canProceed = !data.checkoutShippingMethodUpdate.errors.length;
  if (canProceed) {
    update({ checkout: data.checkoutShippingMethodUpdate.checkout });
  }
}
const completeCheckout = (
  data: completeCheckout,
  history: History,
  clearCheckout: () => void,
  clearCart: () => void,
  alert: AlertManager
) => {
  const canProceed = !data.checkoutComplete.errors.length;

  if (canProceed) {
    clearCheckout();
    clearCart();
    history.push({
      pathname: "/account"
    });
  } else {
    data.checkoutComplete.errors.map(error => {
      alert.show(
        { title: error.message },
        {
          type: "error"
        }
      );
    });
  }
};
const Step7 = props => {
  const { data: user } = useUserDetails();
  const {
    clear: clearCheckout,
  } = React.useContext(CheckoutContext);
  const alert = useAlert();
  const { clear: clearCart } = React.useContext(CartContext);
  const [errors, setErrors] = React.useState([]);
  return (
    <>
      <CheckoutContext.Consumer>
        {({ checkout, update, loading: checkoutLoading }) => (
          <CartContext.Consumer>
            {cart => {
              return (
                <TypedCreateCheckoutMutation
                  onCompleted={async ({
                    checkoutCreate: { checkout, errors }
                  }) => {
                    if (!errors.length) {
                      await update({ checkout });
                    }
                    setErrors(errors);
                  }}
                >
                  {(createCheckout, { loading: mutationLoading }) => (
                    <TypedUpdateCheckoutShippingOptionsMutation
                      onCompleted={data => {
                        proceedToBilling(data, update, "token");
                      }}
                    >
                      {(updateCheckoutShippingOptions, { loading }) => (
                        <TypedPaymentMethodCreateMutation
                          onCompleted={async dataPayment => {
                            const canProceed = !dataPayment
                              .checkoutPaymentCreate.errors.length;
                          }}
                        >
                          {createPaymentMethod => (
                            <TypedCompleteCheckoutMutation
                              onCompleted={data =>
                                completeCheckout(
                                  data,
                                  props.history,
                                  clearCheckout,
                                  clearCart,
                                  alert
                                )
                              }
                            >
                              {(completeCheckout, { loading }) => (
                                <Step7Container
                                  {...props}
                                  cart={cart}
                                  checkoutId={maybe(() => checkout.id, null)}
                                  user={user}
                                  checkout={checkout}
                                  createCheckout={createCheckout}
                                  errors={errors}
                                  onPayment={async () => {
                                    const { token } = checkout;
                                    if (checkout && token) {
                                      const {
                                        billingAddress,
                                        subtotalPrice,
                                        shippingPrice
                                      } = checkout;
                                      const total =
                                        subtotalPrice.gross.amount +
                                        shippingPrice.gross.amount;
                                      await createPaymentMethod({
                                        variables: {
                                          checkoutId: checkout.id,
                                          input: {
                                            amount: total,
                                            billingAddress: {
                                              city: billingAddress.city,
                                              country: billingAddress.country
                                                .code as CountryCode,
                                              countryArea:
                                                billingAddress.countryArea,
                                              firstName:
                                                billingAddress.firstName,
                                              lastName: billingAddress.lastName,
                                              phone: billingAddress.phone,
                                              postalCode:
                                                billingAddress.postalCode,
                                              streetAddress1:
                                                billingAddress.streetAddress1
                                            },
                                            gateway: "Culqi",
                                            token: token
                                          }
                                        }
                                      });
                                      await completeCheckout({
                                        variables: {
                                          checkoutId: checkout.id
                                        }
                                      });
                                    } else {
                                      alert(
                                        "Payment cannot be created, invalid token"
                                      );
                                    }
                                  }}
                                  onClick={data => {
                                    if (user && !checkout) {
                                      const {
                                        destination,
                                        arrival,
                                        departure
                                      } = props.data.step1;
                                      createCheckout({
                                        variables: {
                                          checkoutInput: {
                                            email: data.email,
                                            lines: data.items,
                                            destination: destination,
                                            arrival: moment(arrival, "DD-MM-YYYY").toISOString().split("T")[0],
                                            departure: moment(departure, "DD-MM-YYYY").toISOString().split("T")[0],
                                            comment: "No comments",
                                            shippingAddress: {
                                              firstName: data.firstName,
                                              lastName: data.lastName,
                                              streetAddress1:
                                                data.streetAddress1,
                                              phone: data.phone,
                                              city: data.city,
                                              postalCode: data.postalCode,
                                              country: maybe(
                                                () => "PE",
                                                "PE"
                                              ) as CountryCode
                                            },
                                            billingAddress: {
                                              firstName: data.firstName,
                                              lastName: data.lastName,
                                              streetAddress1:
                                                data.streetAddress1,
                                              city: data.city,
                                              phone: data.phone,
                                              postalCode: data.postalCode,
                                              country: maybe(
                                                () => "PE",
                                                "PE"
                                              ) as CountryCode
                                            }
                                          }
                                        }
                                      });
                                    } else {
                                      const shippingMethods =
                                        checkout.availableShippingMethods || null;
                                        if(shippingMethods && shippingMethods[1]){
                                          updateCheckoutShippingOptions({
                                            variables: {
                                              checkoutId: checkout.id,
                                              shippingMethodId:
                                                shippingMethods[1].id
                                            }
                                          });
                                        }else{
                                          console.log("Invalid Shipping option", checkout)
                                        }
                                    }
                                  }}
                                />
                              )}
                            </TypedCompleteCheckoutMutation>
                          )}
                        </TypedPaymentMethodCreateMutation>
                      )}
                    </TypedUpdateCheckoutShippingOptionsMutation>
                  )}
                </TypedCreateCheckoutMutation>
              );
            }}
          </CartContext.Consumer>
        )}
      </CheckoutContext.Consumer>
    </>
  );
};

class Step7Container extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      displayNewModal: false,
      showLogin: false,
      culqi: () => {},
      setAmount: () => {}
    };
    this.setLogin = this.setLogin.bind(this);
    this.setDisplayNewModal = this.setDisplayNewModal.bind(this);
    this.onSubmit = this.onSubmit.bind(this);
    this.setCulqi = this.setCulqi.bind(this);
  }
  componentDidUpdate() {
    const { checkout } = this.props;
    if (checkout && !checkout.shippingMethod) {
      this.props.onClick();
    }
  }
  setCulqi(culqi, setAmount) {
    this.setState({
      culqi,
      setAmount
    });
    const { checkout } = this.props;
    if (checkout) {
      const total = (
        checkout.subtotalPrice.gross.amount +
        checkout.shippingPrice.gross.amount
      ).toFixed(2);
      setAmount(total * 100);
      culqi();
    } else {
      if (!this.props.user) {
        this.setLogin(true);
      }
      this.setDisplayNewModal(true);
    }
  }
  setLogin(login) {
    this.setState({
      showLogin: login
    });
  }
  setDisplayNewModal(modal) {
    this.setState({
      displayNewModal: modal
    });
  }
  onSubmit(data) {
    if (this.props.user) {
      this.setDisplayNewModal(false);
      const dataShippingAdress = {
        email: this.props.user.email,
        items: this.props.cart.lines,
        firstName: data.firstName,
        lastName: data.lastName,
        streetAddress1: data.streetAddress1,
        city: data.city,
        postalCode: data.postalCode,
        phone: data.phone,
      }
      this.props.onClick(dataShippingAdress);
    } else {
      this.setLogin(true);
    }
  }
  render() {
    const { checkout,cart } = this.props;
    const total = checkout ? checkout.totalPrice.gross.amount : 0;
    const shippingPrice = 0;
    const { displayNewModal, showLogin } = this.state;
    return (
      <div className="container">
        <CulqiProvider
          publicKey="pk_test_6cZH0KR8piY52AOG"
          amount={(total + shippingPrice) * 100}
          title="HackPacking"
          currency="USD"
          description="Travel luggage free from anywhere in the World"
          onToken={token => {
            this.props.onPayment();
            // window.location.href = "/order-history/";
          }}
          onError={error => {
            console.error("something bad happened", error);
            alert("Error");
          }}
          options={{
            lang: "en",
            style: {
              maincolor: "#84BD00",
              buttontext: "#FFFFFF",
              maintext: "#000000",
              desctext: "#575656",
              logo:
                "https://firebasestorage.googleapis.com/v0/b/tariy-ra.appspot.com/o/HackPackingx512.png?alt=media&token=5a1985b2-86af-4a9a-b597-1c07de378a97"
            }
          }}
        >
          <p style={{ fontSize: 18, fontWeight: "500" }}>Overview</p>
          <div className="containr-overview">
            <div className="c-overview">
              <CartSummary checkout={this.props.checkout}></CartSummary>
            </div>
            {this.props.errors.map(err => (
              <p style={{ color: "red", fontSize: 12 }}>{err.message}</p>
            ))}
          </div>
          <Culqi>
            {({ openCulqi, setAmount, amount }) => {
              return (
                <div className="cnt-btn-checkout">
                  <button
                    id="openculqi"
                    onClick={() => this.setCulqi(openCulqi, setAmount)}
                  >
                    {checkout ? "Checkout" : "Add Shipping Address"}
                  </button>
                </div>
              );
            }}
          </Culqi>
          <br />
          <br />
          <br />
          <br />
          <br />
          <br />
        </CulqiProvider>
        <Modal
          loading={false}
          title=""
          hide={() => this.setDisplayNewModal(false)}
          show={displayNewModal}
        >
          <div>
            <div
              style={{
                padding: 20,
                display: "flex",
                justifyContent: "center",
                marginTop: 30
              }}
            >
              {!showLogin ? (
                <ShippingAdressForm
                  hide={() => this.setDisplayNewModal(false)}
                  buttonText="Checkout"
                  onSubmit={data => this.onSubmit(data)}
                >
                  <div>
                    <button
                      style={{
                        fontWeight: 500,
                        fontSize: 18,
                        padding: "0 20px"
                      }}
                    >
                      Shipping Address
                    </button>
                    <br />
                    <br />
                  </div>
                </ShippingAdressForm>
              ) : (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center"
                  }}
                >
                  <button
                    style={{
                      fontWeight: 500,
                      fontSize: 18,
                      padding: "0 20px"
                    }}
                  >
                    Sign In
                  </button>
                  <br />
                  <LoginForm
                    hide={() => {
                      this.setDisplayNewModal(false);
                      this.setLogin(false);
                    }}
                  />
                </div>
              )}
            </div>
          </div>
        </Modal>
      </div>
    );
  }
}
export default Step7;
