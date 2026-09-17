import { ImageResponse } from "next/og";

export const size = { width: 64, height: 64 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#1c2233",
          borderRadius: 14,
        }}
      >
        <span
          style={{
            fontSize: 38,
            fontWeight: 700,
            color: "#c49030",
            fontFamily: "Georgia, serif",
            fontStyle: "italic",
          }}
        >
          T
        </span>
      </div>
    ),
    { ...size }
  );
}
