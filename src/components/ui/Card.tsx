import React from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hover?: boolean;
  children?: React.ReactNode;
  className?: string;
}

export const Card = ({ className, hover, children, ...props }: CardProps) => {
  return (
    <div
      className={cn(
        'bg-white rounded-2xl border border-border-light p-6 transition-all duration-300',
        hover && 'hover:shadow-xl hover:-translate-y-1 hover:border-primary/20',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

export const CardHeader = ({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('flex items-center justify-between mb-6', className)} {...props}>
    {children}
  </div>
);

export const CardTitle = ({ className, children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
  <h3 className={cn('text-lg font-bold text-slate-900', className)} {...props}>
    {children}
  </h3>
);
