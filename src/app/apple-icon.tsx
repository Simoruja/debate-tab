import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background:
            "radial-gradient(120% 120% at 20% 15%, #2a3348 0%, #1c2233 60%)",
        }}
      >
        <span
          style={{
            fontSize: 108,
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
