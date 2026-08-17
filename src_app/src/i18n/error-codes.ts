export const API_ERROR_CODES = {
  authRequired: "AUTH_REQUIRED",
  invalidCredentials: "AUTH_INVALID_CREDENTIALS",
  invalidRegistration: "AUTH_INVALID_REGISTRATION",
  emailTaken: "AUTH_EMAIL_TAKEN",
  invalidProfile: "PROFILE_INVALID",
  publicationNotFound: "PUBLICATION_NOT_FOUND",
  photoNotFound: "PHOTO_NOT_FOUND",
  addressSearchFailed: "ADDRESS_SEARCH_FAILED",
  publicationTitleRequired: "PUBLICATION_TITLE_REQUIRED",
  publicationDescriptionTooLong: "PUBLICATION_DESCRIPTION_TOO_LONG",
  publicationAddressRequired: "PUBLICATION_ADDRESS_REQUIRED",
  publicationCoordinatesInvalid: "PUBLICATION_COORDINATES_INVALID",
  photoRequired: "PHOTO_REQUIRED",
  photoTypeUnsupported: "PHOTO_TYPE_UNSUPPORTED",
  photoTooLarge: "PHOTO_TOO_LARGE",
} as const;

const ERROR_TRANSLATION_KEYS: Record<string, string> = {
  [API_ERROR_CODES.authRequired]: "errors.auth.required",
  [API_ERROR_CODES.invalidCredentials]: "errors.auth.invalidCredentials",
  [API_ERROR_CODES.invalidRegistration]: "errors.auth.invalidRegistration",
  [API_ERROR_CODES.emailTaken]: "errors.auth.emailTaken",
  [API_ERROR_CODES.invalidProfile]: "errors.profile.invalid",
  [API_ERROR_CODES.publicationNotFound]: "errors.publication.notFound",
  [API_ERROR_CODES.photoNotFound]: "errors.photo.notFound",
  [API_ERROR_CODES.addressSearchFailed]: "errors.address.searchFailed",
  [API_ERROR_CODES.publicationTitleRequired]: "validation.publication.titleRequired",
  [API_ERROR_CODES.publicationDescriptionTooLong]: "validation.publication.descriptionTooLong",
  [API_ERROR_CODES.publicationAddressRequired]: "validation.publication.addressRequired",
  [API_ERROR_CODES.publicationCoordinatesInvalid]: "validation.publication.invalidCoordinates",
  [API_ERROR_CODES.photoRequired]: "validation.publication.photoRequired",
  [API_ERROR_CODES.photoTypeUnsupported]: "validation.publication.unsupportedPhotoType",
  [API_ERROR_CODES.photoTooLarge]: "validation.publication.photoTooLarge",
};

export function getErrorTranslationKey(error: string | undefined, fallbackKey: string) {
  return (error && ERROR_TRANSLATION_KEYS[error]) || fallbackKey;
}
