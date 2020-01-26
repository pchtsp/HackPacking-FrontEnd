import * as React from "react";

import { LineI } from "../../../../components/CartTable/ProductRow";

const Line: React.FC<Omit<LineI, "totalPrice">> = props => {
  const { id, product, pricing, name, quantity, variants, cart } = props;
  const { loading } = cart;
  let productVariant = [];
    var color = name.split("/")[0].toLowerCase();
    if (variants) {
        productVariant = variants.filter(variant => variant.isAvailable);
    }
    return (
    <tr key={id}>
      <td style={{ textAlign: "start" }}>{product.name}</td>
      <td style={{ display: "flex", justifyContent: "center" }}>
        <div style={{ display: "flex" }}>
          <div
            className="btn-add-count-quantity"
            style={
              loading
                ? {
                    backgroundColor: "#84bd005c"
                  }
                : {}
            }
            onClick={() => (!loading ? props.removeToItem(id) : null)}
          >
            -
          </div>
          <span style={{ margin: "0 10px" }}> {quantity} </span>
          <div
            className="btn-minus-count-quantity"
            style={
              loading
                ? {
                    backgroundColor: "#84bd005c"
                  }
                : {}
            }
            onClick={() => (!loading ? props.addToItem(id) : null)}
          >
            +
          </div>
        </div>
      </td>
      <td style={{ textAlign: "center" }}>
        {props.stockQuantity ? props.stockQuantity : "-"}
      </td>
      <td style={{ textAlign: "center" }}>
        <div
          className="color-point"
          style={{
            backgroundColor: color,
            margin: "0 auto",
          }}
        />
      </td>
      <td style={{ textAlign: "center" }}>
          <span className="overview-talla-item">
            <select
                name="select"
                onChange={!loading ? (e) => props.onChangeItem(id, e.target.value, quantity) : () => {}}
            >
              {productVariant.map((variant, index) => {
                  return (
                      <option
                          key={`sizes-${index}`}
                          value={variant.id}
                          selected={variant.id === id}
                      >
                          {variant.name}
                      </option>
                  );
              })}
            </select>
          </span>
      </td>
      <td style={{ textAlign: "end" }}>{pricing.price.gross.localized}</td>
      <td>
        <div
          onClick={() => cart.remove(id)}
          style={{
            color: "white",
            backgroundColor: "black",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            borderRadius: 10,
            width: 20,
            cursor: "pointer",
            height: 20,
            fontSize: 10
          }}
        >
          &#10005;
        </div>
      </td>
    </tr>
  );
};
export default Line;
