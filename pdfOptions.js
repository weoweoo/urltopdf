const VALID_FORMATS = new Set([
    'A4', 'A3', 'A2', 'Letter', "Legal"
]);

const DEFAULTS = {
    format: 'A4',
    landscape: false,
    scale: 1,
    margin: {top: '1cm', bottom: '1cm', right: '1cm', left: '1cm'},
    printBackground: true,
};

export function validatePdfOptions(body){
    const errors = [];
    const options = {...DEFAULTS };

  // ── format ────────────────────────────────────────────────────
if (body.format !== undefined) {
    if (!VALID_FORMATS.has(body.format)) {
        errors.push(`Invalid Fromat "${body.format}". Must be one of: ${[...VALID_FORMATS].join(',')};`);
    } else {
        options.format = body.format;
    }
}

  // ── landscape ─────────────────────────────────────────────────
  if (body.landscape !== undefined) {
    if (typeof body.landscape !== 'boolean') {
        errors.push('landscape must be a boolean (true or false)')
  } else {
    options.landscape = body.landscape;
  }
}

  // ── scale ─────────────────────────────────────────────────
  if (body.scale !== undefined) {
    const s = Number(body.scale);
    if (isNaN(s) || s<0.1 || s>2) {
        errors.push('Scale number must be between 0.1 and 2');
  } else {
    options.scale = s;
  }
}

  // ── margin ─────────────────────────────────────────────────
  if (body.margin !== undefined) {
    if (typeof body.margin !== 'object' || Array.isArray(body.margin)) {
        errors.push('Margin must be an object with keys: top, bottom, right, left');
  } else {
    options.margin = {...options.margin, ...body.margin};
  }
}

return {options,errors};
}