export type InitialBookingStatus = 'PENDING' | 'CONFIRMED';

export const isBookingSlotAvailable = (conflictingAppointment: unknown): boolean => {
  return !conflictingAppointment;
};

export const getInitialBookingStatus = (
  autoAcceptBookings: boolean,
  conflictingAppointment: unknown
): InitialBookingStatus => {
  if (!autoAcceptBookings) {
    return 'PENDING';
  }

  return isBookingSlotAvailable(conflictingAppointment) ? 'CONFIRMED' : 'PENDING';
};

export const isReviewEligibleFromCompletedBooking = (completedBooking: unknown): boolean => {
  return !!completedBooking;
};

export const calculateAverageRatingToOneDecimal = (ratings: number[]): number => {
  if (!ratings.length) {
    return 0;
  }

  const avgRating = ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length;
  return Math.round(avgRating * 10) / 10;
};
