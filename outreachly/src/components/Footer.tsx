"use client";

import Link from "next/link";
import {
  Github,
  Twitter,
  Linkedin,
  Mail,
  Phone,
  MapPin,
  Shield,
  Heart,
} from "lucide-react";

interface FooterLinkSection {
  title: string;
  links: {
    label: string;
    href: string;
    external?: boolean;
  }[];
}

interface SocialLink {
  name: string;
  href: string;
  icon: React.ReactNode;
  ariaLabel: string;
}

export default function Footer() {
  const currentYear = new Date().getFullYear();

  const footerSections: FooterLinkSection[] = [
    {
      title: "Product",
      links: [
        { label: "Dashboard", href: "/" },
        { label: "Templates", href: "/templates" },
        { label: "Campaigns", href: "/campaigns" },
        { label: "Contacts", href: "/contacts" },
      ],
    },
    {
      title: "Company",
      links: [
        { label: "About Us", href: "/about" },
        { label: "Careers", href: "/careers" },
        { label: "Blog", href: "/blog" },
        { label: "Press", href: "/press" },
      ],
    },
    {
      title: "Support",
      links: [
        { label: "Help Center", href: "/help" },
        { label: "Documentation", href: "/docs" },
        { label: "API Reference", href: "/api-docs" },
        { label: "Status", href: "/status", external: true },
      ],
    },
    {
      title: "Legal",
      links: [
        { label: "Privacy Policy", href: "/privacy" },
        { label: "Terms of Service", href: "/terms" },
        { label: "Cookie Policy", href: "/cookies" },
        { label: "GDPR", href: "/gdpr" },
      ],
    },
  ];

  const socialLinks: SocialLink[] = [
    {
      name: "GitHub",
      href: "https://github.com/outreachly",
      icon: <Github className="h-5 w-5" />,
      ariaLabel: "Follow us on GitHub",
    },
    {
      name: "Twitter",
      href: "https://twitter.com/outreachly",
      icon: <Twitter className="h-5 w-5" />,
      ariaLabel: "Follow us on Twitter",
    },
    {
      name: "LinkedIn",
      href: "https://linkedin.com/company/outreachly",
      icon: <Linkedin className="h-5 w-5" />,
      ariaLabel: "Connect with us on LinkedIn",
    },
  ];

  const contactInfo = [
    {
      icon: <Mail className="h-4 w-4" />,
      label: "Email",
      value: "contact@outreachly.com",
      href: "mailto:contact@outreachly.com",
    },
    {
      icon: <Phone className="h-4 w-4" />,
      label: "Phone",
      value: "+1 (555) 123-4567",
      href: "tel:+15551234567",
    },
    {
      icon: <MapPin className="h-4 w-4" />,
      label: "Address",
      value: "123 Business Ave, Suite 100, San Francisco, CA 94105",
      href: "https://maps.google.com/?q=123+Business+Ave+Suite+100+San+Francisco+CA+94105",
    },
  ];

  return (
    <footer
      className="bg-gradient-to-r from-gray-900 via-blue-900 to-purple-900 text-white mt-auto"
      role="contentinfo"
      aria-labelledby="footer-heading"
    >
      {/* Main Footer Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-8">
          {/* Company Info and Contact */}
          <div className="lg:col-span-2">
            <h2 id="footer-heading" className="text-2xl font-bold mb-4">
              Outreachly
            </h2>
            <p className="text-gray-300 mb-6 max-w-md">
              Streamline your outreach campaigns with powerful automation,
              beautiful templates, and comprehensive analytics. Connect with
              your audience like never before.
            </p>

            {/* Contact Information */}
            <div className="space-y-3 mb-6">
              <h3 className="text-lg font-semibold mb-3">Contact Us</h3>
              {contactInfo.map((item, index) => (
                <div key={index} className="flex items-center space-x-3">
                  <span className="text-blue-400" aria-hidden="true">
                    {item.icon}
                  </span>
                  <div>
                    <span className="sr-only">{item.label}: </span>
                    {item.href ? (
                      <a
                        href={item.href}
                        className="text-gray-300 hover:text-white transition-colors duration-200"
                        {...(item.href.startsWith("http") && {
                          target: "_blank",
                          rel: "noopener noreferrer",
                        })}
                      >
                        {item.value}
                      </a>
                    ) : (
                      <span className="text-gray-300">{item.value}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Footer Link Sections */}
          {footerSections.map((section, sectionIndex) => (
            <div key={sectionIndex} className="lg:col-span-1">
              <h3 className="text-lg font-semibold mb-4">{section.title}</h3>
              <ul className="space-y-2" role="list">
                {section.links.map((link, linkIndex) => (
                  <li key={linkIndex}>
                    {link.external ? (
                      <a
                        href={link.href}
                        className="text-gray-300 hover:text-white transition-colors duration-200 text-sm"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {link.label}
                        <span className="sr-only"> (opens in new tab)</span>
                      </a>
                    ) : (
                      <Link
                        href={link.href}
                        className="text-gray-300 hover:text-white transition-colors duration-200 text-sm"
                      >
                        {link.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Newsletter Signup */}
        <div className="mt-12 pt-8 border-t border-gray-700">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between space-y-6 lg:space-y-0">
            <div className="flex-1 max-w-md">
              <h3 className="text-lg font-semibold mb-2">Stay Updated</h3>
              <p className="text-gray-300 text-sm mb-4">
                Get the latest news, updates, and tips delivered to your inbox.
              </p>
              <form
                className="flex flex-col sm:flex-row gap-3"
                onSubmit={(e) => {
                  e.preventDefault();
                  // Newsletter signup logic would go here
                  console.log("Newsletter signup submitted");
                }}
              >
                <label htmlFor="newsletter-email" className="sr-only">
                  Email address for newsletter
                </label>
                <input
                  id="newsletter-email"
                  type="email"
                  required
                  placeholder="Enter your email"
                  className="flex-1 px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  aria-describedby="newsletter-description"
                />
                <button
                  type="submit"
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900"
                >
                  Subscribe
                </button>
              </form>
              <p
                id="newsletter-description"
                className="text-xs text-gray-400 mt-2"
              >
                We respect your privacy. Unsubscribe at any time.
              </p>
            </div>

            {/* Social Links */}
            <div className="flex-shrink-0">
              <h3 className="text-lg font-semibold mb-4">Follow Us</h3>
              <div className="flex space-x-4">
                {socialLinks.map((social, index) => (
                  <a
                    key={index}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900"
                    aria-label={social.ariaLabel}
                  >
                    {social.icon}
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-gray-700 bg-gray-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0">
            {/* Copyright */}
            <div className="flex items-center space-x-2 text-sm text-gray-400">
              <span>&copy; {currentYear} Outreachly. All rights reserved.</span>
              <span className="hidden sm:inline">•</span>
              <span className="hidden sm:flex sm:items-center">
                Made with{" "}
                <Heart
                  className="h-4 w-4 text-red-500 mx-1"
                  aria-hidden="true"
                />{" "}
                for better outreach
              </span>
            </div>

            {/* Accessibility & Legal Links */}
            <div className="flex items-center space-x-6 text-sm">
              <Link
                href="/accessibility"
                className="text-gray-400 hover:text-white transition-colors duration-200 flex items-center space-x-1"
              >
                <Shield className="h-4 w-4" aria-hidden="true" />
                <span>Accessibility</span>
              </Link>
              <Link
                href="/sitemap"
                className="text-gray-400 hover:text-white transition-colors duration-200"
              >
                Sitemap
              </Link>
              <button
                onClick={() => {
                  // Cookie preferences logic would go here
                  console.log("Cookie preferences opened");
                }}
                className="text-gray-400 hover:text-white transition-colors duration-200 focus:outline-none focus:underline"
                type="button"
              >
                Cookie Preferences
              </button>
            </div>
          </div>

          {/* Accessibility Statement */}
          <div className="mt-4 pt-4 border-t border-gray-800">
            <p className="text-xs text-gray-500 max-w-4xl">
              <strong>Accessibility Commitment:</strong> Outreachly is committed
              to providing a website that is accessible to the widest possible
              audience, regardless of technology or ability. We are actively
              working to increase the accessibility and usability of our website
              and strive to adhere to Web Content Accessibility Guidelines
              (WCAG) 2.1 Level AA. If you experience any difficulty in accessing
              any part of this website, please feel free to{" "}
              <a
                href="mailto:accessibility@outreachly.com"
                className="text-blue-400 hover:text-blue-300 underline"
              >
                contact our accessibility team
              </a>{" "}
              and we will work to provide the information you need in an
              alternative format.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
