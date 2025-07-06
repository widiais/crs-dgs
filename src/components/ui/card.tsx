import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className = '', children, ...props }, ref) => {
    const classes = `rounded-lg border border-gray-200 bg-white text-gray-950 shadow-sm ${className}`.trim();
    
    return (
      <div
        ref={ref}
        className={classes}
        {...props}
      >
        {children}
      </div>
    );
  }
);
Card.displayName = 'Card';

const CardHeader = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className = '', children, ...props }, ref) => {
    const classes = `flex flex-col space-y-1.5 p-6 ${className}`.trim();
    
    return (
      <div ref={ref} className={classes} {...props}>
        {children}
      </div>
    );
  }
);
CardHeader.displayName = 'CardHeader';

const CardTitle = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className = '', children, ...props }, ref) => {
    const classes = `text-2xl font-semibold leading-none tracking-tight ${className}`.trim();
    
    return (
      <h3 ref={ref} className={classes} {...props}>
        {children}
      </h3>
    );
  }
);
CardTitle.displayName = 'CardTitle';

const CardDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className = '', children, ...props }, ref) => {
    const classes = `text-sm text-gray-500 ${className}`.trim();
    
    return (
      <p ref={ref} className={classes} {...props}>
        {children}
      </p>
    );
  }
);
CardDescription.displayName = 'CardDescription';

const CardContent = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className = '', children, ...props }, ref) => {
    const classes = `p-6 pt-0 ${className}`.trim();
    
    return (
      <div ref={ref} className={classes} {...props}>
        {children}
      </div>
    );
  }
);
CardContent.displayName = 'CardContent';

const CardFooter = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className = '', children, ...props }, ref) => {
    const classes = `flex items-center p-6 pt-0 ${className}`.trim();
    
    return (
      <div ref={ref} className={classes} {...props}>
        {children}
      </div>
    );
  }
);
CardFooter.displayName = 'CardFooter';

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent }; 