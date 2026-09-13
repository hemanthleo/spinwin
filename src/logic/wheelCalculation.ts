/**
 * Mathematical calculations for wheel rotation angles, pointer alignment,
 * and slice collision detection.
 */

export interface WheelAngleTarget {
  targetAngle: number; // total rotation in degrees to end at
  targetSliceIndex: number;
  sliceAngle: number;
}

/**
 * Calculates the exact target rotation angle (in degrees) to land on `winnerIndex`.
 * 
 * Pointer position is assumed to be at top center (270 degrees in Canvas standard coordinate system).
 */
export function calculateTargetAngle(
  winnerIndex: number,
  totalSlices: number,
  currentAngle: number = 0,
  minRotations: number = 6
): WheelAngleTarget {
  if (totalSlices <= 0) {
    return { targetAngle: currentAngle, targetSliceIndex: 0, sliceAngle: 360 };
  }

  const sliceAngle = 360 / totalSlices;

  // Center angle of the target slice relative to slice 0 start (0 degrees = 3 o'clock)
  // Add a small natural randomness (center +/- 35% of slice angle)
  const offsetWithinSlice = (Math.random() - 0.5) * 0.7 * sliceAngle;
  const sliceCenterAngle = winnerIndex * sliceAngle + sliceAngle / 2 + offsetWithinSlice;

  // Pointer is at Top Center (270 degrees)
  const pointerAngle = 270;

  // We want (pointerAngle - targetWheelRotation) % 360 == sliceCenterAngle % 360
  // targetWheelRotation % 360 = (pointerAngle - sliceCenterAngle) % 360
  let targetRotationMod = (pointerAngle - sliceCenterAngle) % 360;
  if (targetRotationMod < 0) {
    targetRotationMod += 360;
  }

  // Calculate current rotation normalized modulo 360
  const currentRotationMod = ((currentAngle % 360) + 360) % 360;

  // Additional degrees needed to reach target rotation modulo
  let deltaDegrees = targetRotationMod - currentRotationMod;
  if (deltaDegrees <= 0) {
    deltaDegrees += 360;
  }

  // Add full extra rotations for smooth spinning effect
  const totalExtraRotations = minRotations * 360;
  const finalTargetAngle = currentAngle + totalExtraRotations + deltaDegrees;

  return {
    targetAngle: finalTargetAngle,
    targetSliceIndex: winnerIndex,
    sliceAngle,
  };
}

/**
 * Given the current wheel rotation angle in degrees, determines which slice
 * is currently located directly underneath the top pointer (270 degrees).
 */
export function getCurrentSliceIndexUnderPointer(
  currentAngle: number,
  totalSlices: number
): number {
  if (totalSlices <= 0) return 0;
  const sliceAngle = 360 / totalSlices;
  const pointerAngle = 270;

  // Calculate current wheel rotation modulo 360
  const currentAngleMod = ((currentAngle % 360) + 360) % 360;

  // Angle under pointer on the wheel surface
  let angleOnWheel = (pointerAngle - currentAngleMod) % 360;
  if (angleOnWheel < 0) {
    angleOnWheel += 360;
  }

  const index = Math.floor(angleOnWheel / sliceAngle);
  return Math.max(0, Math.min(totalSlices - 1, index));
}

/**
 * Smooth ease-out quintic curve for realistic physical spin deceleration.
 */
export function easeOutQuint(t: number): number {
  return 1 - Math.pow(1 - t, 5);
}

/**
 * Custom ease-out cubic curve.
 */
export function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}
